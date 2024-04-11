const dat = require('dat.gui');
const Simulation = require('./simulation');


const gui = new dat.GUI();
const simulationFolder = gui.addFolder('simulation');

const simulation = new Simulation(simulationFolder);

function animate() {
    requestAnimationFrame(animate);
    simulation.animate();
}

animate();
