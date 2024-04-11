const math = require('mathjs');

module.exports = class TrainingBasedModulation {
    params;
    onChangeCallback;
    isSendingTrainingSymbols;
    currentSymbolCount;
    channelMatrixEstimate;

    constructor(gui) {
        this.params = {
            numDataSymbols: 100,
            shortPreamble: false
        }

        gui.add(this.params, 'numDataSymbols', 0).onChange(() => this.reset());
        gui.add(this.params, 'shortPreamble').onChange(() => this.reset());

        this.isSendingTrainingSymbols = true;
        this.currentSymbolCount = 0;

        this.channelMatrixEstimate = math.matrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    }

    reset() {
        this.isSendingTrainingSymbols = true;
        this.currentSymbolCount = 0;

        if (this.onChangeCallback) {
            this.onChangeCallback();
        }
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    nextSymbol(dataSource) {
        if (this.isSendingTrainingSymbols) {
            if (this.params.shortPreamble) {
                this.isSendingTrainingSymbols = false;
                this.currentSymbolCount = 0;
            } else if (this.currentSymbolCount >= 3) {
                this.isSendingTrainingSymbols = false;
                this.currentSymbolCount = 0;
            }
        } else if (this.currentSymbolCount >= this.params.numDataSymbols) {
            this.isSendingTrainingSymbols = true;
            this.currentSymbolCount = 0;
        }

        this.currentSymbolCount += 1;

        if (this.isSendingTrainingSymbols) {
            if (this.params.shortPreamble) {
                return [1, 0, 0];
            } else {
                const symbols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
                const symbol = symbols[this.currentSymbolCount - 1];

                return symbol;
            }
        } else {
            return dataSource.nextSymbol();
        }
    }

    update(signal) {
        if (this.isSendingTrainingSymbols) {
            if (this.params.shortPreamble) {
                const s = signal.toArray();

                this.channelMatrixEstimate = math.matrix([
                    [s[0], s[2], s[1]],
                    [s[1], s[0], s[2]],
                    [s[2], s[1], s[0]]
                ]);
            } else {
                this.channelMatrixEstimate.subset(math.index([0, 1, 2], this.currentSymbolCount - 1), signal);
            }

            console.log(this.channelMatrixEstimate);

            return undefined;
        } else {
            const symbolEstimate = math.multiply(math.inv(this.channelMatrixEstimate), signal);

            const symbols = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
            var closestSymbol;
            var closestSymbolDistance = Infinity;

            for (var i = 0; i < symbols.length; i++) {
                const symbol = symbols[i];
                var symbolDistance = 0;

                for (var j = 0; j < 3; j++) {
                    symbolDistance += (symbol[j] - symbolEstimate.subset(math.index(j))) ** 2;
                }

                if (symbolDistance < closestSymbolDistance) {
                    closestSymbol = symbol;
                    closestSymbolDistance = symbolDistance;
                }
            }

            return closestSymbol;
        }
    }
}
