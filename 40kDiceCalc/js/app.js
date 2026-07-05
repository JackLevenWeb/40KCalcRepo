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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <div class="input-field" style="flex-grow: 1; margin-right: 15px;">
                <label>Unit Name</label>
                <input type="text" class="in-unit-name" value="Attacker Unit" style="width: 100%; font-weight: bold;" />
            </div>
            <button class="remove-btn" style="background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer; padding: 5px 10px; height: fit-content;">Remove</button>
        </div>

        <div class="checkbox-group" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
          <label class="checkbox-label"><input type="checkbox" class="is-leader"> 👑 Is Leader?</label>
        </div>

        <div class="leader-options" style="display: none; background: var(--surface-hover); padding: 10px; border-radius: 6px; margin-bottom: 15px;">
          <div class="input-group">
              <div class="input-field">
                 <label>Attach to Unit:</label>
                 <select class="attach-to"><option value="">-- Select Unit --</option></select>
              </div>
              <div class="input-field">
                 <label>Grant Keyword to Unit:</label>
                 <select class="grant-keyword">
                    <option value="none">None</option>
                    <option value="lethal">Lethal Hits</option>
                    <option value="devastating">Devastating Wounds</option>
                    <option value="sustained">Sustained Hits 1</option>
                 </select>
              </div>
          </div>
        </div>

        <div class="input-group">
          <div class="input-field"><label>Units</label><input type="number" class="in-units" value="1" min="1" /></div>
          <div class="input-field"><label>Models per Unit</label><input type="number" class="in-models" value="5" min="1" /></div>
          <div class="input-field"><label>Attacks (A)</label><input type="number" class="in-attacks" value="4" min="1" /></div>
          <div class="input-field"><label>BS/WS</label><input type="text" class="in-bsws" value="3" /></div>
          <div class="input-field"><label>Strength (S)</label><input type="number" class="in-str" value="4" min="1" /></div>
          <div class="input-field"><label>AP</label><input type="number" class="in-ap" value="-1" max="0" /></div>
          <div class="input-field"><label>Damage (D)</label><input type="number" class="in-dam" value="1" min="1" /></div>
        </div>
        <div class="input-group">
          <div class="input-field"><label>Crit Hit Threshold</label><input type="number" class="in-crit-hit" value="6" min="2" max="6" /></div>
          <div class="input-field"><label>Crit Wound Threshold</label><input type="number" class="in-crit-wound" value="6" min="2" max="6" /></div>
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
          <label class="checkbox-label"><input type="checkbox" class="kw-cleave"> Cleave</label>
        </div>
        <div class="input-group">
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-sustained"> Sustained</label><input type="number" class="val-sustained" value="1" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-melta"> Melta</label><input type="number" class="val-melta" value="2" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-rapidfire"> Rapid Fire</label><input type="number" class="val-rapidfire" value="1" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-anti"> Anti-X</label><input type="number" class="val-anti" value="4" min="2" max="6" /></div>
        </div>
      </div>
    `;

    RosterContainer.insertAdjacentHTML('beforeend', moduleHTML);
    const newModule = RosterContainer.lastElementChild;

    // Toggle Leader Options
    const isLeaderCheck = newModule.querySelector(".is-leader");
    const leaderOptions = newModule.querySelector(".leader-options");
    isLeaderCheck.addEventListener("change", (e) => {
        leaderOptions.style.display = e.target.checked ? "block" : "none";
        updateAllLeaderDropdowns();
    });

    // Update dropdowns when someone types a new name
    newModule.querySelector(".in-unit-name").addEventListener("input", updateAllLeaderDropdowns);

    // Delete Button Logic
    newModule.querySelector(".remove-btn").addEventListener("click", () => {
        if (document.querySelectorAll('.attacker-module').length > 1) {
            newModule.remove();
            updateAllLeaderDropdowns(); // Refresh if a target is deleted!
        } else {
            alert("You must have at least one attacker!");
        }
    });

    // Run once on spawn
    updateAllLeaderDropdowns();
}

// THE DYNAMIC DROPDOWN MANAGER
function updateAllLeaderDropdowns() {
    const modules = document.querySelectorAll('.attacker-module');
    const allNames = Array.from(modules).map(m => m.querySelector('.in-unit-name').value.trim());

    modules.forEach(module => {
        const select = module.querySelector('.attach-to');
        const currentSelection = select.value;
        const myName = module.querySelector('.in-unit-name').value.trim();

        // Clear existing options
        select.innerHTML = '<option value="">-- Select Unit --</option>';

        // Repopulate with all names EXCEPT this module's own name
        allNames.forEach(name => {
            if (name && name !== myName) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            }
        });

        // Restore their previous selection if that unit wasn't deleted
        if (allNames.includes(currentSelection)) {
            select.value = currentSelection;
        }
    });
}

// --- DATA GATHERING (PHASE 2) ---
function createWeaponsArray() {
    const modules = document.querySelectorAll('.attacker-module');
    const weaponsArray = [];

    modules.forEach(module => {
        const attack = parseInt(module.querySelector(".in-attacks").value, 10);
        const bsws = module.querySelector(".in-bsws").value; // Handled as string for Torrent NA
        const strength = parseInt(module.querySelector(".in-str").value, 10);
        const ap = parseInt(module.querySelector(".in-ap").value, 10);
        const damage = parseInt(module.querySelector(".in-dam").value, 10);
        const modelCount = parseInt(module.querySelector(".in-models").value, 10);
        const unitCount = parseInt(module.querySelector(".in-units").value, 10);

        const modifiers = {
            critHitThreshold: parseInt(module.querySelector(".in-crit-hit").value, 10),
            critWoundThreshold: parseInt(module.querySelector(".in-crit-wound").value, 10),
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

    const modifiers = {
        minusOneHit: document.getElementById("def-minus-hit").checked,
        minusOneWound: document.getElementById("def-minus-wound").checked,
        minusOneWoundHighStr: document.getElementById("def-minus-wound-str").checked,
        cover: document.getElementById("def-cover").checked,
        halfDamage: document.getElementById("def-half-dam").checked,
        minusOneDamage: document.getElementById("def-minus-dam").checked,
    };

    return new Unit(toughness, wounds, save, inVul, fnp, modelCount, modifiers);
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