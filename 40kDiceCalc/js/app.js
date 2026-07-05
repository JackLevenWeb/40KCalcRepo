import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';

const CalcBtn = document.getElementById("calculate-btn");
const AddAttackerBtn = document.getElementById("add-attacker-btn");
const RosterContainer = document.getElementById("attacker-roster");

// Load one default module on startup
addAttackerModule();

// --- UI LOGIC (PHASE 1) ---
AddAttackerBtn.addEventListener("click", addAttackerModule);

function addAttackerModule() {
    const moduleHTML = `
      <div class="attacker-module" style="background: var(--bg-color); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h4 style="margin: 0; border: none; color: var(--accent-blue);">Weapon Profile</h4>
            <button class="remove-btn" style="background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer; padding: 2px 8px;">X</button>
        </div>
        <div class="input-group">
          <div class="input-field"><label>Units</label><input type="number" class="in-units" value="1" min="1" /></div>
          <div class="input-field"><label>Models per Unit</label><input type="number" class="in-models" value="5" min="1" /></div>
          <div class="input-field"><label>Attacks (A)</label><input type="number" class="in-attacks" value="4" min="1" /></div>
          <div class="input-field"><label>BS/WS</label><input type="number" class="in-bsws" value="3" min="2" max="6" /></div>
          <div class="input-field"><label>Strength (S)</label><input type="number" class="in-str" value="4" min="1" /></div>
          <div class="input-field"><label>AP</label><input type="number" class="in-ap" value="-1" max="0" /></div>
          <div class="input-field"><label>Damage (D)</label><input type="number" class="in-dam" value="1" min="1" /></div>
        </div>
        <div class="input-group">
          <div class="input-field"><label>Hit Mod</label><select class="mod-hit"><option value="0">None</option><option value="1">+1</option><option value="-1">-1</option></select></div>
          <div class="input-field"><label>Wound Mod</label><select class="mod-wound"><option value="0">None</option><option value="1">+1</option><option value="-1">-1</option></select></div>
          <div class="input-field"><label>Reroll Hits</label><select class="reroll-hits"><option value="none">None</option><option value="ones">Reroll 1s</option><option value="all">Reroll All</option></select></div>
          <div class="input-field"><label>Reroll Wounds</label><select class="reroll-wounds"><option value="none">None</option><option value="ones">Reroll 1s</option><option value="all">Reroll All</option></select></div>
        </div>
        <div class="checkbox-group" style="margin-bottom: 10px;">
          <label class="checkbox-label"><input type="checkbox" class="kw-lethal"> Lethal</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-devastating"> Devastating</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-torrent"> Torrent</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-twinlinked"> Twin-Linked</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-blast"> Blast</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-cleave"> cleave</label>
        </div>
        <div class="input-group">
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-sustained"> Sustained</label><input type="number" class="val-sustained" value="1" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-melta"> Melta</label><input type="number" class="val-melta" value="2" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-rapidfire"> Rapid Fire</label><input type="number" class="val-rapidfire" value="1" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-anti"> Anti-X</label><input type="number" class="val-anti" value="4" min="2" max="6" /></div>
        </div>
      </div>
    `;

    // Add it to the screen
    RosterContainer.insertAdjacentHTML('beforeend', moduleHTML);

    // Wire up the delete button for this specific module
    const newModule = RosterContainer.lastElementChild;
    newModule.querySelector(".remove-btn").addEventListener("click", () => {
        if (document.querySelectorAll('.attacker-module').length > 1) {
            newModule.remove();
        } else {
            alert("You must have at least one attacker!");
        }
    });
}

// --- DATA GATHERING (PHASE 2) ---
function createWeaponsArray() {
    const modules = document.querySelectorAll('.attacker-module');
    const weaponsArray = [];

    modules.forEach(module => {
        const attack = parseInt(module.querySelector(".in-attacks").value, 10);
        const bsws = parseInt(module.querySelector(".in-bsws").value, 10);
        const strength = parseInt(module.querySelector(".in-str").value, 10);
        const ap = parseInt(module.querySelector(".in-ap").value, 10);
        const damage = parseInt(module.querySelector(".in-dam").value, 10);
        const modelCount = parseInt(module.querySelector(".in-models").value, 10);
        const unitCount = parseInt(module.querySelector(".in-units").value, 10);

        const modifiers = {
            hitMod: parseInt(module.querySelector(".mod-hit").value, 10),
            woundMod: parseInt(module.querySelector(".mod-wound").value, 10),
            rerollHits: module.querySelector(".reroll-hits").value,
            rerollWounds: module.querySelector(".reroll-wounds").value,
            lethal: module.querySelector(".kw-lethal").checked,
            devastating: module.querySelector(".kw-devastating").checked,
            torrent: module.querySelector(".kw-torrent").checked,
            twinLinked: module.querySelector(".kw-twinlinked").checked,
            blast: module.querySelector(".kw-blast").checked,
            cleave: module.querySelector(".kw-cleave").checked,
            sustained: module.querySelector(".kw-sustained").checked ? parseInt(module.querySelector(".val-sustained").value, 10) : 0,
            melta: module.querySelector(".kw-melta").checked ? parseInt(module.querySelector(".val-melta").value, 10) : 0,
            rapidFire: module.querySelector(".kw-rapidfire").checked ? parseInt(module.querySelector(".val-rapidfire").value, 10) : 0,
            anti: module.querySelector(".kw-anti").checked ? parseInt(module.querySelector(".val-anti").value, 10) : 0
        };

        weaponsArray.push(new Weapon(attack, bsws, strength, ap, damage, modelCount, unitCount, modifiers));
    });

    return weaponsArray;
}

function createUnit() {
    const toughness = parseInt(document.getElementById("toughness").value, 10);
    const wounds = parseInt(document.getElementById("wounds").value, 10);
    const save = parseInt(document.getElementById("save").value, 10);
    const inVul = parseInt(document.getElementById("inVul").value, 10) || null;
    const fnp = parseInt(document.getElementById("def-fnp").value, 10) || null;
    const modelCount = parseInt(document.getElementById("target-models").value, 10);

    return new Unit(toughness, wounds, save, inVul, fnp, modelCount);
}

// --- BUTTON EXECUTION ---
CalcBtn.addEventListener("click", () => {
    const displayScreen = document.getElementById("results-output");
    displayScreen.textContent = "Rolling 10,000 dice... Please wait! 🎲";
    CalcBtn.disabled = true;

    setTimeout(() => {
        // Grab the ARRAY of weapons now, not just one!
        const attackerWeapons = createWeaponsArray();
        const targetUnit = createUnit();

        const results = runSimulation(10000, attackerWeapons, targetUnit);

        const formattedOutput = `
🎲 SIMULATION COMPLETE (${results.SimulatedRuns.toLocaleString()} Runs)
======================================================

📊 AVERAGES (Per Attack Sequence)
------------------------------------------------------
Average Total Damage:   ${results.averages.damage.toFixed(2)}
Average Models Killed:  ${results.averages.killed.toFixed(2)}
Average Wasted Damage:  ${results.averages.wasted.toFixed(2)}
Damage Efficiency:      ${results.averages.efficiency}%

🔥 EXTREMES (Highest & Lowest Spikes)
------------------------------------------------------
Highest Total Damage:   ${results.extremes.highestDamage}
Highest Models Killed:  ${results.extremes.highestKills}
Lowest Total Damage:    ${results.extremes.lowestDamage}
Lowest Models Killed:   ${results.extremes.lowestKilled}
`;
        displayScreen.textContent = formattedOutput.trim();
        CalcBtn.disabled = false;
    }, 10);
});