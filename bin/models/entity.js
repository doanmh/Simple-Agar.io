'use strict'

var config = require('../config/config.js');
var util = require('../lib/util.js')();

class Entity {
    constructor(x, y, radius, randomPosition) {
        if (!randomPosition) {
            this.x = x;
            this.y = y;
        } else {
            this.x = Math.floor((Math.random() * config.gameWidth) + 1);
            this.y = Math.floor((Math.random() * config.gameHeight) + 1);
        }
        this.hue = Math.round(util.randGolden()*360);
        this.radius = radius;
    }
}

module.exports = Entity;