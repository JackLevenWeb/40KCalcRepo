import { runSimulation } from './logic.js';

self.addEventListener('message', (event) => {

    const { iterations, weaponsArray, targetUnit } = event.data;
    const results = runSimulation(iterations, weaponsArray, targetUnit);

    self.postMessage(results);

});