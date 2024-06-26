const THREE = global.THREE = require('three');
const OrbitControls = require("./three_addons/OrbitControls");
const math = require('mathjs');

const RandomDataSource = require('./data_source/random');
const TrainingBasedModulation = require('./modulation/training_based');

module.exports = class Simulation {
    params;

    clock;
    timeAccumulator;

    scene;
    camera;
    renderer;
    transmitter;

    dataSource;
    modulation;

    numCorrectBits;
    numIncorrectBits;

    constructor(gui) {
        this.params = {
            frequency: 100,
            noise: 0.1,
            rotation: 10,
            modulation: false
        }

        gui.add(this.params, 'frequency', 0).onChange(() => this.reset());
        gui.add(this.params, 'noise', 0).onChange(() => this.reset());
        gui.add(this.params, 'rotation', 0).onChange(() => this.reset());
        gui.add(this.params, 'modulation', { trainingBased: true }).onChange(() => this.reset());

        this.clock = new THREE.Clock();
        this.timeAccumulator = 0;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        new OrbitControls(this.camera, this.renderer.domElement);

        const geometry = new THREE.BoxGeometry(1, 0.1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.transmitter = new THREE.Mesh(geometry, material);
        this.transmitter.position.y = -2;
        this.scene.add(this.transmitter);

        this.camera.position.z = 5;

        this.dataSource = new RandomDataSource();

        this.modulation = new TrainingBasedModulation(gui.addFolder('modulation'));
        this.modulation.onChange(() => this.reset())

        this.numCorrectBits = 0;
        this.numIncorrectBits = 0;
    }

    reset() {
        this.clock.start();
        this.numCorrectBits = 0;
        this.numIncorrectBits = 0;
    }

    animate() {
        const delta = this.clock.getDelta();

        this.transmitter.rotation.y += ((this.params.rotation * 2 * Math.PI) / 60) * delta;

        this.timeAccumulator += delta;
        const period = 1 / this.params.frequency;

        while (this.timeAccumulator >= period) {
            this.update();
            this.timeAccumulator -= period;
        }

        this.renderer.render(this.scene, this.camera);
    }

    update() {
        const symbol = this.modulation.nextSymbol(this.dataSource);
        const signal = this.compute(symbol);
        const estimatedSymbol = this.modulation.update(signal);

        if (estimatedSymbol) {
            for (var i = 0; i < 3; i++) {
                if (symbol[i] == estimatedSymbol[i]) {
                    this.numCorrectBits += 1;
                } else {
                    this.numIncorrectBits += 1;
                }
            }

            const bitErrorRate = (this.numIncorrectBits / (this.numCorrectBits + this.numIncorrectBits)) * 100;
            document.getElementById("ber").innerText = "BER: " + bitErrorRate.toFixed(2) + " %";

            const dataRate = (this.numCorrectBits + this.numIncorrectBits) / this.clock.elapsedTime;
            document.getElementById("dr").innerText = "DR: " + dataRate.toFixed(2) + " bps";
        }
    }

    compute(symbol) {
        const polarizationAngles = [0, 60, 120];
        const channelMatrix = math.matrix([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);

        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                const angleDifference = (((polarizationAngles[i] - polarizationAngles[j]) * Math.PI) / 180) + this.transmitter.rotation.y;
                const value = Math.cos(angleDifference) ** 2;

                channelMatrix.subset(math.index(i, j), value);
            }
        }

        const noise = math.matrix([gaussianRandom(0, this.params.noise), gaussianRandom(0, this.params.noise), gaussianRandom(0, this.params.noise)]);

        return math.add(math.multiply(channelMatrix, symbol), noise);
    }
}

function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    return z * stdev + mean;
}
