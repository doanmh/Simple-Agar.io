function util () {
    var GOLDEN = 0.618033988749895;
    return {
        log: function(n, base) {
            var log = Math.log;
            return log(n) / (base ? log(base) : 1);
        },
        randGolden: function() {
            return (Math.random() + GOLDEN) % 1;
        }
    }
};

module.exports = util;
