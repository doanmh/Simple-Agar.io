function util () {
    return {
        log: function(n, base) {
            var log = Math.log;
            return log(n) / (base ? log(base) : 1);
        }
    }
};

module.exports = util;
