var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/../client'));

var gameWidth = gameHeight = 5000;

var players = [];
var sockets = {};

// TODO: Handle logics in here 
io.on('connection', function(socket) {
    console.log("A user connected!");
    
    var currentPlayer = {
        id: socket.id,
        x: Math.floor((Math.random() * gameWidth) + 1),
        y: Math.floor((Math.random() * gameHeight) + 1),
        screenWidth: 0,
        screenHeight: 0,
        radius: 30,
        target: {
            x:0,
            y:0
        }
    }

    socket.on('respawn', function(player) {
        currentPlayer.screenWidth = player.screenWidth;
        currentPlayer.screenHeight = player.screenHeight;
        players.push(currentPlayer);
        sockets[currentPlayer.id] = socket;
    });

    socket.emit('render', currentPlayer);

    socket.on('disconnect', function() {
        console.log("User disconnected from the game!");
    }); 
});

// IP and Port configuration
var host = process.env.IP || "0.0.0.0";
var port = process.env.PORT || "3000";
http.listen(port, host, function() {
    console.log('[DEBUG] Listening on ' + host + ':' + port);
});