var io = require('socket.io-client');

var cv = document.getElementById("canvas1");
var ctx = cv.getContext("2d");
var color = "red";
var borderColor = "black";
var screenWidth, screenHeight;
var gameWidth, gameHeight;

var isMouseIn = false;
var mouseX, mouseY;
var socket;

var players = [];

var player = {
    id: -1,
    x: window.innerWidth/2,
    y: window.innerHeight/2,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    target: {
        x: 0,
        y: 0
    }
}

//Set up mouse events
document.onmousemove = function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}

document.onmouseover = function() {
    isMouseIn = true;
}

document.onmouseout = function() {
    isMouseIn = false;
}

window.onload = function() {
    initFrame(cv);
    socket = io();
    socket.emit('respawn', player);
    console.log(player.screenWidth + " " + player.screenHeight);
    setupSocket(socket);
    startGame();
}

var setupSocket = function(socket) {

    socket.on('disconnect', function() {
        socket.close();
    });

    socket.on('gameSetup', function(data) {
        gameWidth = data.gameWidth;
        gameHeight = data.gameHeight;
    });

    socket.on('welcome', function(playerSetting) {
        player = playerSetting;
    })

    socket.on('updatePlayer', function(playerData) {
        player = playerData;
    })

    socket.on('updateGame', function(playerArray) {
        players = playerArray;
    });
}

var gameLoop = function() {
    // console.log(player.id);
    ctx.clearRect(0, 0, cv.width, cv.height)
    
    for (var i = 0; i < players.length; i++) {
        drawPlayers(players[i]);
    }

    if (isMouseIn) {
        var target = {
            x: mouseX,
            y: mouseY
        }
        
        socket.emit('updatePlayerTarget', target);
    }
}

window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.msRequestAnimationFrame     ||
            function( callback ) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

var animloop = function() {
    window.requestAnimFrame(animloop);
    gameLoop();
}

var startGame = function() {
    initFrame(cv);
    animloop();
}

var drawPlayers = function(p) {
    var x, y;
    // console.log(player.x + " " + player.y);
    if (p.id == player.id) {
        x = screenWidth/2;
        y = screenHeight/2;
    } else {
        x = p.x - player.x + screenWidth/2;
        y = p.y - player.y + screenHeight/2;
    }
    ctx.fillStyle = color;
	ctx.strokeStyle = borderColor;
	ctx.lineWidth = 5;
		
	ctx.beginPath();
	ctx.arc(x, y, player.radius, 0, 2 * Math.PI, false);
	ctx.fill();
	ctx.stroke();
}

var initFrame = function(canvas) {
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
    screenWidth = ctx.canvas.width;
    screenHeight = ctx.canvas.height;
}