//#region imports >>>>>>>>>>>>>>>>>>>>>>>

// runSimulation from logic.js
import { runSimulation } from './logic.js';

//#endregion

//#region worker thread >>>>>>>>>>>>>>>>>>>>>>>

// runs simulation loops on background thread
self.addEventListener('message', (event) => {
    const { iterations, weaponsArray, targetUnit } = event.data;

    const results = runSimulation(iterations, weaponsArray, targetUnit);

    self.postMessage(results);
});

//#endregion