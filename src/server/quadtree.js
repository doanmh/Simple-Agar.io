function QuadTree (lvl, boundaries) {
    var MAX_OBJECTS = 5;
    var MAX_LEVELS = 5;
    var level = lvl;
    var bound = boundaries;
    var objects = [];
    var nodes = [];

    var subWidth = bound.width/2;
    var subHeight = bound.height/2;
    var xMid = bound.x + subWidth;
    var yMid = bound.y + subHeight;

    var clear = function() {
        objects = [];
        nodes = [];
    }

    var split = function() {
        nodes[0] = new QuadTree(level + 1, {x: xMid, y: bound.y, width: subWidth, height: subHeight});
        nodes[1] = new QuadTree(level + 1, {x: bound.x, y: bound.y, width: subWidth, height: subHeight});
        nodes[2] = new QuadTree(level + 1, {x: bound.x, y: yMid, width: subWidth, height: subHeight});
        nodes[3] = new QuadTree(level + 1, {x: xMid, y: yMid, width: subWidth, height: subHeight});
    }

    var getIndex = function(obj) {
        var topHalf = obj.y + obj.radius < yMid && obj.y - obj.radius > bound.y;
        var bottomHalf = obj.y + obj.radius  < bound.y + bound.height && obj.y - obj.radius > yMid;      
        var leftHalf = obj.x + obj.radius < xMid && obj.x - obj.radius > bound.x;
        var rightHalf = obj.x + obj.radius < bound.x + bound.height && obj.x - obj.radius > xMid;

        if (topHalf && rightHalf) {
            return 0;
        } else if (topHalf && leftHalf) {
            return 1;
        } else if (bottomHalf && leftHalf) {
            return 2;
        } else if (bottomHalf && rightHalf) {
            return 3;
        }

        return -1;
    }

    var insert = function(obj) {
        var index = getIndex(obj);
        var i = 0;
        
        if (nodes[0] && index != -1) {
            nodes[index].insert(obj);
            return;
        }

        objects.push(obj);
        // console.log(objects.length);

        if (objects.length > MAX_OBJECTS && level < MAX_LEVELS) {
            if (!nodes[0]) {
                // console.log("split")
                split();
            }

            while (i < objects.length) {
                if (index !== -1) {
                    nodes[index].insert(objects[i]);
                    objects.splice(i, 1);
                } else {
                    i += 1
                }
            }   
        }
    }

    var retrieve = function(list, obj) {
        if (obj.x + obj.radius < bound.x + bound.width && obj.x - obj.radius > bound.x
            && obj.y + obj.radius < bound.y + bound.height && obj.y - obj.radius > bound.y) {

            for (var o in objects) {
                if (objects[o] !== obj) {
                    list.push(objects[o]);
                }
            }

            if (nodes.length) {
                nodes[0].retrieve(list, obj);
                nodes[1].retrieve(list, obj);
                nodes[2].retrieve(list, obj);
                nodes[3].retrieve(list, obj);
            }
        }

        return list;
    }

    return {
        clear: clear,
        insert: insert,
        retrieve: retrieve
    }
}

module.exports = QuadTree;