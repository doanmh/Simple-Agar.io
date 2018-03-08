'use strict'

var Entity = require('./entity.js');
var config = require('../config/config.js')

class Player extends Entity {
    constructor (id, x, y, radius, mass, randomPosition, screenWidth, screenHeight, target) {
        super(x, y, radius, randomPosition);
        this.id = id;
        this.mass = mass;
        this.speed = config.playerBaseSpeed;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.target = target;
        this.positionBuffer = [];
    }
}

module.exports = Player;