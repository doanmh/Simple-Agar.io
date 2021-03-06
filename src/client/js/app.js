var io = require('socket.io-client');

var Player = require('../../models/player.js');
var util = require('../../lib/util.js')();

var cv = document.getElementById("canvas1");
var ctx = cv.getContext("2d");
var color = "red";
var borderColor = "black";
var screenWidth, screenHeight;
var gameWidth, gameHeight;

var isMouseIn = false;
var mouseX, mouseY;
var socket;

var allPlayers = {};

var players = [];
var tempPlayers = [];
var food = [];

var pendingInputs = [];

var inputSequenceNum = 0;
var lastProcessedInput = 0;
var tempLastProcessedInput = 0;

var player = new Player(-1, 0, 0, 20, 10, false, window.innerWidth, window.innerHeight, {x: 0, y: 0});
var tempPlayer;

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

// Setup window
window.onload = function() {
    initFrame(cv);
    socket = io();
    socket.emit('respawn', player);
    setupSocket(socket);
    startGame();
}

window.onresize = function() {
    initFrame(cv);
    socket.emit('resize', {
        screenWidth: screenWidth,
        screenHeight: screenHeight
    });
}

var setupSocket = function(socket) {

    socket.on('disconnect', function() {
        console.log("disconnected");
        socket.close();
    });

    socket.on('gameSetup', function(data) {
        gameWidth = data.gameWidth;
        gameHeight = data.gameHeight;
    });

    socket.on('welcome', function(playerSetting) {
        player = Object.assign({}, playerSetting);
    });

    socket.on('updatePlayer', function(data) {
        tempPlayers = data.playerArray;
        tempPlayer = data.player;
        tempLastProcessedInput = data.last_input;
    })

    socket.on('updateFood', function(foodArray) {
        food = foodArray;
    })
}

var gameLoop = function() {
    var target = {};

    ctx.clearRect(0, 0, cv.width, cv.height);

    processServerMessage();

    if (isMouseIn) {
        target = {
            seq: inputSequenceNum,
            x: mouseX,
            y: mouseY
        }
    } else {
        target = {
            seq: inputSequenceNum,
            x: screenWidth/2,
            y: screenHeight/2
        }
    }

    inputSequenceNum++;

    pendingInputs.push(target);

    applyInput(target);
    
    drawGrid();

    for (var i = 0; i < food.length; i++) {
        drawEntities(food[i]);
    }

    interpolateEntity();

    for (var key in allPlayers) {
        if (player.id !== allPlayers[key].id) {
            drawEntities(allPlayers[key]);
        }
    }

    drawEntities(player);

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

var applyInput = function(input) {
    var xdiff, ydiff;
    var targetX = input.x - player.screenWidth/2;
    var targetY = input.y - player.screenHeight/2;
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

var processServerMessage = function() {
    players = tempPlayers.splice(0);
    player = Object.assign({}, tempPlayer);
    lastProcessedInput = tempLastProcessedInput;

    var j = 0;
    while (j < pendingInputs.length) {
        var input = pendingInputs[j];
        if (input.seq <= lastProcessedInput) {
            pendingInputs.splice(j, 1);
        } else {
            applyInput(input);
            j++;
        }
    }
    
    if (players.length != 0) {
        for (var key in allPlayers) {
            var found = false;
            for (var i = 0; i < players.length; i++) {
                if (allPlayers[key].id == players[i].id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                delete allPlayers[key];
            }
        }
    }

    for (var i = 0; i < players.length; i++) {
        var p = players[i];
        if (p.id == player.id) {
            continue;
        }
        if (!allPlayers[p.id]) {
            var newPlayer = Object.assign({}, p);
            newPlayer.positionBuffer = [];
            allPlayers[p.id] = newPlayer;
        }

        var entity = allPlayers[p.id];
        entity.radius = p.radius;

        if (p.id == player.id) {
            continue;
        } else {
            var timestamp = new Date();
            entity.positionBuffer.push([timestamp, p]);
        }
    }
}

var interpolateEntity = function() {
    var now = new Date();
    var renderTimestamp = now - (1000.0 / 60);

    for (var key in allPlayers) {
        var entity = allPlayers[key];
        
        if (entity.id == player.id) {
            continue;
        }

        var buffer = entity.positionBuffer;

        while (buffer.length >= 2 && buffer[1][0] <= renderTimestamp) {
            buffer.shift();
        }

        if (buffer.length >= 2 && buffer[0][0] <= renderTimestamp && renderTimestamp <= buffer[1][0]) {
            var x0 = buffer[0][1].x;
            var x1 = buffer[1][1].x;
            var y0 = buffer[0][1].y;
            var y1 = buffer[1][1].y;
            var t0 = buffer[0][0];
            var t1 = buffer[1][0];

            entity.x = x0 + (x1 - x0) * (renderTimestamp - t0) / (t1 - t0);
            entity.y = y0 + (y1 - y0) * (renderTimestamp - t0) / (t1 - t0);
        }
    }
}

var drawEntities = function(p) {
    var x, y;
    if (p.id == player.id) {
        x = screenWidth/2;
        y = screenHeight/2;
    } else {
        x = p.x - player.x + screenWidth/2;
        y = p.y - player.y + screenHeight/2;
    }

    ctx.fillStyle = 'hsl(' + p.hue + ', 100%, 45%)';
	ctx.strokeStyle = 'hsl(' + p.hue + ', 100%, 50%)';
	ctx.lineWidth = 3;
		
	ctx.beginPath();
	ctx.arc(x, y, p.radius, 0, 2 * Math.PI, false);
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