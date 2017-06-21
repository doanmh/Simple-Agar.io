var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var QuadTree = require('simple-quadtree');
var SAT = require('sat');

app.use(express.static(__dirname + '/../client'));

var gameWidth = gameHeight = 800;

var players = [];
var food = [];
var sockets = {};

var velocity = 1;

var V = SAT.Vector;
var C = SAT.Circle;

var tree = QuadTree(0, 0, gameWidth, gameHeight);

// Setup Sockets
io.on('connection', function(socket) {
    console.log("A user connected!");
    
    var currentPlayer = {
        id: socket.id,
        x: Math.floor((Math.random() * gameWidth) + 1),
        y: Math.floor((Math.random() * gameHeight) + 1),
        radius: 30,
        mass: 0,
        target: {
            x:0,
            y:0
        }
    }

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
            currentPlayer.target = target;
        }
    });

});

// Big loop function
var gameLoop = function() {
    balanceFood();
}

var moveLoop = function() {
    for (var i = 0; i < players.length; i++) {
        updatePlayer(players[i]);
    }
}

var updateLoop = function() {
    for (var i = 0; i < players.length; i++) {
        sockets[players[i].id].emit("updateGame", players, food);
    }
}


// Core functions
var updatePlayer = function(player) {
    movePlayer(player);

    // tree.clear();
    // players.forEach(tree.insert);

    var playerCircle = new C(new V(player.x, player.y), player.radius);

    for (var i = 0; i < food.length; i++) {
        var f = food[i];
        if (SAT.pointInCircle(new V(f.x, f.y), playerCircle)) {
            player.mass++;
            food.splice(i, 1);
        }
    }

    for (var i = 0; i < players.length; i++) {
        var other = players[i];
        if (other !== player) {
            var collided = SAT.testCircleCircle(playerCircle, new C(new V(other.x, other.y), other.radius));
            if (collided) {
                if (player.mass >= 1.1*other.mass) {
                    sockets[other.id].emit('disconnect');
                } else if (other.mass >= 1.1*player.mass) {
                    sockets[player.id].emit('disconnect');
                }
            } 
        }
    }
}

var movePlayer = function(player) {
    var xdiff, ydiff;
    var targetX = player.target.x - player.screenWidth/2;
    var targetY = player.target.y - player.screenHeight/2;
    var deg = Math.atan2(targetY, targetX);
    
    if (Math.abs(targetX) <= 10 && Math.abs(targetY) <= 10) {
        xdiff = 0;
        ydiff = 0;
    } else {
        xdiff = velocity * Math.cos(deg);
        ydiff = velocity * Math.sin(deg);
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
    var foodToAdd = 15 - food.length;
    for (var i = 0; i < foodToAdd; i++) {
        food.push({
            x: Math.floor((Math.random() * gameWidth) + 1),
            y: Math.floor((Math.random() * gameHeight) + 1), 
            radius: 10
        });
    }
}

// Set interval
setInterval(gameLoop, 1000);
setInterval(moveLoop, 1000/60);
setInterval(updateLoop, 1000/40);

// IP and Port configuration
var host = process.env.IP || "0.0.0.0";
var port = process.env.PORT || "3000";
http.listen(port, host, function() {
    console.log('[DEBUG] Listening on ' + host + ':' + port);
});