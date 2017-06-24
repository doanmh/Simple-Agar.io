'use strict'
var Entity = require('./entity.js');

class Food extends Entity {
    constructor(x, y, radius, mass, randomPosition) {
        super(x, y, radius, randomPosition);
        this.mass = mass;
    }
}

module.exports = Food;