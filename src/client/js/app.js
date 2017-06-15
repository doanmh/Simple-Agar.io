var io = require('socket.io-client');

var cv = document.getElementById("canvas1");
var ctx = cv.getContext("2d");
var color = "red";
var borderColor = "black";
var screenWidth, screenHeight;

var isMouseIn = false;
var mouseX, mouseY;
var socket;

var players = [];

var player = {
    id: -1,
    x: window.innerWidth/2,
    y: window.innerHeight/2,
    screeWidth: screenWidth,
    screenHeight: screenHeight,
    target: {
        x: window.innerWidth/2,
        y: window.innerHeight/2
    }
}

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
    setupSocket(socket);
    startGame();
}

var setupSocket = function() {
    socket.on('disconnect', function() {
        socket.close();
    });
    socket.on('render', function(playerData) {
        player = playerData;
        drawPlayer(player);
    });
    socket.on("playerMove", function(players) {
        players = players;
    });
}

var gameLoop = function() {
    if (isMouseIn) {
        player.target.x = mouseX;
        player.target.y = mouseY;
        // TODO:
        socket.emit("updatePlayer", player);
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

var drawPlayer = function(player) {
    ctx.fillStyle = color;
	ctx.strokeStyle = borderColor;
	ctx.lineWidth = 5;
		
	ctx.beginPath();
	ctx.arc(screenWidth/2, screenHeight/2, player.radius, 0, 2 * Math.PI, false);
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