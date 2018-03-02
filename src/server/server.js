var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var SAT = require('sat');

var QuadTree = require('../lib/quadtree.js');
var config = require('../config/config.js');
var Entity = require('../models/entity.js');
var Player = require('../models/player.js');
var Food = require('../models/food.js');
var util = require('../lib/util.js')();

app.use(express.static(__dirname + '/../client'));

var gameWidth = config.gameWidth;
var gameHeight = config.gameHeight

var players = [];
var food = [];
var sockets = {};
var lastProcessedInput = [];

var V = SAT.Vector;
var C = SAT.Circle;
var GOLDEN = 0.618033988749895;

var tree = QuadTree(0, {x: 0, y: 0, width: gameWidth, height: gameHeight});

// Setup Sockets
io.on('connection', function(socket) {
    console.log("A user connected!");

    var currentPlayer = new Player(socket.id, 0, 0, 20, 10, true, 0, 0, {x: 0, y: 0});

    console.log(currentPlayer.x + " " + currentPlayer.y);

    socket.on('disconnect', function() {
        var index = players.indexOf(currentPlayer);
        if (index > -1) {
            var index = players.splice(index, 1);
        }
        console.log("User disconnected from the game!");
        console.log("Total: " + players.length);
    }); 

    socket.on('respawn', function(player) {
        currentPlayer.screenWidth = player.screenWidth;
        currentPlayer.screenHeight = player.screenHeight;
        players.push(currentPlayer);
        sockets[currentPlayer.id] = socket;
        socket.emit('gameSetup', {
            gameWidth: gameWidth,
            gameHeight: gameHeight
        });
        socket.emit('welcome', currentPlayer);
        console.log("Total: " + players.length);
    });
  
    socket.on('updatePlayerTarget', function(target) {
        if (target.x !== currentPlayer.x || target.y !== currentPlayer.y) {
            lastProcessedInput[currentPlayer.id] = target.seq;
            currentPlayer.target = target;
        }
    });

    socket.on('resize', function(data){
        currentPlayer.screenWidth = data.screenWidth;
        currentPlayer.screenHeight = data.screenHeight;
    });
});

// Big loop function
var gameLoop = function() {
    balanceFood();
}

var updateLoop = function() {
    for (var i = 0; i < players.length; i++) {
        updatePlayer(players[i]);
    }
}

// Core functions
var updatePlayer = function(player) {
    movePlayer(player);
    
    var playerCircle = new C(new V(player.x, player.y), player.radius);
    var camera = new Entity(player.x, player.y, player.screenWidth > player.screenHeight ? player.screenWidth/2 : player.screenHeight/2, false);

    tree.clear();
    food.forEach(tree.insert);
    players.forEach(tree.insert);

    var foodToRender = [];
    var playerCollisions = [];

    var entitiesToRender = tree.retrieveFoodAndPlayer([], [], camera, Player, Food);
    foodToRender = entitiesToRender.foodArray;
    playerCollisions = entitiesToRender.playerArray;

    for (var i = 0; i < foodToRender.length; i++) {
        var f = foodToRender[i];
        if (SAT.pointInCircle(new V(f.x, f.y), playerCircle)) {
            player.mass++;
            player.radius += 0.5;
            food.splice(food.indexOf(f), 1);
        }
    }

    sockets[player.id].emit('updateFood', foodToRender);

    for (var i = 0; i < playerCollisions.length; i++) {
        var other = playerCollisions[i];
        if (other !== player) {
            var collided = SAT.testCircleCircle(playerCircle, new C(new V(other.x, other.y), other.radius));
            if (collided) {
                if (player.mass > 1.1*other.mass ) {
                    player.mass += other.mass;
                    player.radius += 0.5*other.mass;
                    sockets[other.id].emit('disconnect');
                } else if (other.mass > 1.1*player.mass) {
                    other.mass += player.mass;
                    other.radius += 0.5*player.mass;
                    sockets[player.id].emit('disconnect');
                }
            } 
        }
    }

    sockets[player.id].emit('updatePlayer', {last_input: lastProcessedInput[player.id], playerArray: playerCollisions, player: player});
}

var movePlayer = function(player) {
    var xdiff, ydiff;
    var targetX = player.target.x - player.screenWidth/2;
    var targetY = player.target.y - player.screenHeight/2;
    var deg = Math.atan2(targetY, targetX);
    var slowdown = util.log(player.mass, 5) - util.log(10, 5) + 1;
    
    if (Math.abs(targetX) == 0 && Math.abs(targetY) ==0) {
        xdiff = 0;
        ydiff = 0;
    } else if (Math.abs(targetX) <= player.radius && Math.abs(targetY) <= player.radius) {
        // if mouse inside player then slow down
        xdiff = player.speed * Math.cos(deg)/slowdown*1.1*Math.abs(targetX)/player.radius;
        ydiff = player.speed * Math.sin(deg)/slowdown*1.1*Math.abs(targetY)/player.radius;
    } else {
        xdiff = player.speed * Math.cos(deg)/slowdown;
        ydiff = player.speed * Math.sin(deg)/slowdown;
    }
    
    if (!isNaN(xdiff)) {
        if (player.x + xdiff <=0 || player.x + xdiff >= gameWidth) {
            player.x += 0;
        } else {
            player.x += xdiff;
        } 
    }
    
    if (!isNaN(ydiff)) {
        if (player.y + ydiff <= 0 || player.y + ydiff >= gameHeight) {
            player.y += 0;
        } else {
            player.y += ydiff;
        }
    }
}

// Helper function
var balanceFood = function() {
    var foodToAdd = config.totalFood - food.length;
    for (var i = 0; i < foodToAdd; i++) {
        food.push(new Food(0, 0, 7, 1, true));
    }
}

// Set interval
setInterval(gameLoop, 1000);
setInterval(updateLoop, 1000/60);

// IP and Port configuration
var host = process.env.IP || "0.0.0.0";
var port = process.env.PORT || "3000";
http.listen(port, host, function() {
    console.log('[DEBUG] Listening on ' + host + ':' + port);
});