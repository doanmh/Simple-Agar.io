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
    });

    socket.on('updateGame', function(playerArray) {
        players = playerArray;
        for (var i = 0; i < playerArray.length; i++) {
            if (player.id == playerArray[i].id) {
                player = playerArray[i];
                i = playerArray.length;
            }
        }
    });
}

var gameLoop = function() {
    var target = {};

    ctx.clearRect(0, 0, cv.width, cv.height)
    
    drawGrid();

    for (var i = 0; i < players.length; i++) {
        if (player.id !== players[i].id) {
            drawPlayers(players[i]);
        }
    }

    drawPlayers(player);

    if (isMouseIn) {
        target = {
            x: mouseX,
            y: mouseY
        }
    } else {
        target = {
            x: screenWidth/2,
            y: screenHeight/2
        }
    }

    socket.emit('updatePlayerTarget', target);
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

var drawGrid = function() {
    var start = Math.floor((player.x - screenWidth/2)/40);
    var relX = start * 40 - player.x + screenWidth/2;

    var numLines = screenWidth/40;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#BFBFBF';
    ctx.lineWidth = 1;

    ctx.fillRect(0, 0, screenWidth, screenHeight);

    for (var i = 0; i < numLines; i++) {
        ctx.beginPath();
		ctx.moveTo(relX + (40 * i), 0);
		ctx.lineTo(relX + (40 * i), screenHeight);
		ctx.stroke();
    }

    start = Math.floor((player.y - screenHeight/2)/40);
    var relY = start * 40 - player.y + screenHeight/2;

    numLines = screenHeight/40;

    for (var i = 0; i < numLines; i++) {
        ctx.beginPath();
		ctx.moveTo(0, relY + (40 * i));
		ctx.lineTo(screenWidth, relY + (40 * i));
		ctx.stroke();
    }
}

var initFrame = function(canvas) {
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width  = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
    screenWidth = ctx.canvas.width;
    screenHeight = ctx.canvas.height;
}