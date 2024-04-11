const math = require('mathjs');

module.exports = class RandomDataSource {
    nextSymbol() {
        return math.randomInt([3], 0, 2);
    }
}
