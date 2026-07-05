import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';

const CalcBtn = document.getElementById("calculate-btn");
const AddAttackerBtn = document.getElementById("add-attacker-btn");
const RosterContainer = document.getElementById("attacker-roster");

let damageChartInstance = null; // Stores our chart so we can update it

// Initialize
addAttackerModule();

// --- REACTIVE UI EVENT LISTENER ---
RosterContainer.addEventListener("input", syncAppUI);
RosterContainer.addEventListener("change", syncAppUI);

// --- 1. UI GENERATION ---
AddAttackerBtn.addEventListener("click", () => {
    addAttackerModule();
    syncAppUI();
});

function addAttackerModule() {
    const moduleHTML = `
      <div class="attacker-module" style="background: var(--bg-color); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px; transition: all 0.3s;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div class="input-field" style="flex-grow: 1; margin-right: 15px;">
                <label>Unit Name</label>
                <input type="text" class="in-unit-name" value="Attacker Unit" style="width: 100%; font-weight: bold; font-size: 1.1rem;" />
                <div class="attached-leaders-display"></div>
            </div>
            <button class="remove-btn" style="background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer; padding: 5px 10px;">Remove</button>
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
                    <option value="sustained">Sustained Hits</option>
                    <option value="lance">Lance (+1 Wound on Charge)</option>
                    <option value="reroll-hits-ones">Reroll 1s to Hit</option>
                    <option value="reroll-wounds-ones">Reroll 1s to Wound</option>
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
          <div class="input-field"><label>Hit Mod</label><select class="mod-hit"><option value="0">None</option><option value="1">+1</option><option value="-1">-1</option></select></div>
          <div class="input-field"><label>Wound Mod</label><select class="mod-wound"><option value="0">None</option><option value="1">+1</option><option value="-1">-1</option></select></div>
          <div class="input-field"><label>Reroll Hits</label><select class="reroll-hits"><option value="none">None</option><option value="ones">Reroll 1s</option><option value="all">Reroll All</option></select></div>
          <div class="input-field"><label>Reroll Wounds</label><select class="reroll-wounds"><option value="none">None</option><option value="ones">Reroll 1s</option><option value="all">Reroll All</option></select></div>
        </div>

        <div class="checkbox-group" style="margin-bottom: 10px;">
          <label class="checkbox-label"><input type="checkbox" class="kw-lethal"> Lethal</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-devastating"> Devastating</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-lance"> Lance</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-torrent"> Torrent</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-twinlinked"> Twin-Linked</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-blast"> Blast</label>
          <label class="checkbox-label"><input type="checkbox" class="kw-cleave"> Cleave</label>
        </div>

        <div class="input-group">
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-sustained"> Sustained</label><input type="number" class="val-sustained" value="1" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-melta"> Melta</label><input type="number" class="val-melta" value="2" min="1" /></div>
           <div class="keyword-with-value"><label class="checkbox-label"><input type="checkbox" class="kw-anti"> Anti-X</label><input type="number" class="val-anti" value="4" min="2" max="6" /></div>
        </div>
      </div>
    `;

    RosterContainer.insertAdjacentHTML('beforeend', moduleHTML);
    const newModule = RosterContainer.lastElementChild;

    newModule.querySelector(".remove-btn").addEventListener("click", () => {
        if (document.querySelectorAll('.attacker-module').length > 1) {
            newModule.remove();
            syncAppUI();
        } else {
            alert("You must have at least one attacker!");
        }
    });
}


// --- 2. THE REACTIVITY ENGINE ---
function syncAppUI() {
    const modules = document.querySelectorAll('.attacker-module');
    const allNames = Array.from(modules).map(m => m.querySelector('.in-unit-name').value.trim());

    // Phase A: Reset baseline UI States & Apply Glowing Highlights
    modules.forEach(module => {
        module.querySelector('.in-units').disabled = false;
        module.querySelector('.attached-leaders-display').innerHTML = '';

        // **NEW LOGIC: Clear any checkbox/dropdown that was auto-checked by the computer!**
        module.querySelectorAll('input[type="checkbox"][data-granted="true"]').forEach(cb => {
            cb.checked = false;
            cb.removeAttribute('data-granted');
        });
        module.querySelectorAll('select[data-granted="true"]').forEach(sel => {
            sel.value = "none";
            sel.removeAttribute('data-granted');
        });

        // Unlock all keyword controls
        ['.kw-lethal', '.kw-devastating', '.kw-lance', '.kw-sustained', '.reroll-hits', '.reroll-wounds'].forEach(selector => {
            const el = module.querySelector(selector);
            if (el) el.disabled = false;
        });

        // Toggle Leader Dropdown Visibility
        const isLeader = module.querySelector('.is-leader').checked;
        module.querySelector('.leader-options').style.display = isLeader ? "block" : "none";

        // Update Dynamic Name Dropdowns for Leaders
        const select = module.querySelector('.attach-to');
        const currentSelection = select.value;
        const myName = module.querySelector('.in-unit-name').value.trim();
        select.innerHTML = '<option value="">-- Select Unit --</option>';
        allNames.forEach(name => {
            if (name && name !== myName) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            }
        });
        if (allNames.includes(currentSelection)) select.value = currentSelection;

        // Apply Glow Highlights to active Checkboxes
        module.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            const label = cb.closest('.checkbox-label');
            if (label) cb.checked ? label.classList.add('active-text-glow') : label.classList.remove('active-text-glow');
        });

        // Apply Glow Highlights to active Dropdowns
        module.querySelectorAll('select').forEach(sel => {
            if (sel.value !== "0" && sel.value !== "none" && sel.value !== "") {
                sel.classList.add('active-border-glow');
            } else {
                sel.classList.remove('active-border-glow');
            }
        });
    });

    // Phase B: Resolve Leader Attachments (Mutate Bodyguard UI)
    modules.forEach(leaderModule => {
        const isLeader = leaderModule.querySelector('.is-leader').checked;
        const targetName = leaderModule.querySelector('.attach-to').value;
        const granted = leaderModule.querySelector('.grant-keyword').value;
        const leaderName = leaderModule.querySelector('.in-unit-name').value.trim();

        if (isLeader && targetName) {
            const targetModule = Array.from(modules).find(m => m.querySelector('.in-unit-name').value.trim() === targetName);

            if (targetModule) {
                targetModule.querySelector('.attached-leaders-display').innerHTML += `<span class="leader-badge">🛡️ Attached: ${leaderName}</span> `;

                const unitInput = targetModule.querySelector('.in-units');
                unitInput.value = 1;
                unitInput.disabled = true;

                // **NEW LOGIC: Apply the "data-granted" sticker to anything we force on**
                if (granted === "lethal") {
                    const cb = targetModule.querySelector('.kw-lethal');
                    cb.checked = true; cb.disabled = true; cb.dataset.granted = "true";
                    cb.closest('.checkbox-label').classList.add('active-text-glow');
                } else if (granted === "devastating") {
                    const cb = targetModule.querySelector('.kw-devastating');
                    cb.checked = true; cb.disabled = true; cb.dataset.granted = "true";
                    cb.closest('.checkbox-label').classList.add('active-text-glow');
                } else if (granted === "lance") {
                    const cb = targetModule.querySelector('.kw-lance');
                    cb.checked = true; cb.disabled = true; cb.dataset.granted = "true";
                    cb.closest('.checkbox-label').classList.add('active-text-glow');
                } else if (granted === "sustained") {
                    const cb = targetModule.querySelector('.kw-sustained');
                    cb.checked = true; cb.disabled = true; cb.dataset.granted = "true";
                    cb.closest('.checkbox-label').classList.add('active-text-glow');
                } else if (granted === "reroll-hits-ones") {
                    const sel = targetModule.querySelector('.reroll-hits');
                    if (sel.value === "none") {
                        sel.value = "ones";
                        sel.dataset.granted = "true"; // Add sticker so we can reset it later
                    }
                    sel.disabled = true;
                    sel.classList.add('active-border-glow');
                } else if (granted === "reroll-wounds-ones") {
                    const sel = targetModule.querySelector('.reroll-wounds');
                    if (sel.value === "none") {
                        sel.value = "ones";
                        sel.dataset.granted = "true";
                    }
                    sel.disabled = true;
                    sel.classList.add('active-border-glow');
                }
            }
        }
    });
}


// --- 3. DATA GATHERING ---
function createWeaponsArray() {
    const modules = document.querySelectorAll('.attacker-module');
    const weaponsArray = [];

    modules.forEach(module => {
        const unitName = module.querySelector(".in-unit-name").value.trim();
        const attack = parseInt(module.querySelector(".in-attacks").value, 10);
        const bsws = module.querySelector(".in-bsws").value;
        const strength = parseInt(module.querySelector(".in-str").value, 10);
        const ap = parseInt(module.querySelector(".in-ap").value, 10);
        const damage = parseInt(module.querySelector(".in-dam").value, 10);
        const modelCount = parseInt(module.querySelector(".in-models").value, 10);
        const unitCount = parseInt(module.querySelector(".in-units").value, 10);

        const modifiers = {
            isLeader: module.querySelector(".is-leader").checked,
            attachTarget: module.querySelector(".attach-to").value,
            grantedKeyword: module.querySelector(".grant-keyword").value,

            critHitThreshold: module.querySelector(".in-crit-hit") ? parseInt(module.querySelector(".in-crit-hit").value, 10) : 6,
            critWoundThreshold: module.querySelector(".in-crit-wound") ? parseInt(module.querySelector(".in-crit-wound").value, 10) : 6,
            hitMod: parseInt(module.querySelector(".mod-hit").value, 10),
            woundMod: parseInt(module.querySelector(".mod-wound").value, 10),
            rerollHits: module.querySelector(".reroll-hits").value,
            rerollWounds: module.querySelector(".reroll-wounds").value,

            lethal: module.querySelector(".kw-lethal").checked,
            devastating: module.querySelector(".kw-devastating").checked,
            lance: module.querySelector(".kw-lance").checked,
            torrent: module.querySelector(".kw-torrent").checked,
            twinLinked: module.querySelector(".kw-twinlinked").checked,
            blast: module.querySelector(".kw-blast").checked,
            cleave: module.querySelector(".kw-cleave").checked,

            sustained: module.querySelector(".kw-sustained").checked ? parseInt(module.querySelector(".val-sustained").value, 10) : 0,
            melta: module.querySelector(".kw-melta").checked ? parseInt(module.querySelector(".val-melta").value, 10) : 0,
            anti: module.querySelector(".kw-anti").checked ? parseInt(module.querySelector(".val-anti").value, 10) : 0
        };

        weaponsArray.push(new Weapon(unitName, attack, bsws, strength, ap, damage, modelCount, unitCount, modifiers));
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

// --- 4. EXECUTION ---
CalcBtn.addEventListener("click", () => {
    const displayScreen = document.getElementById("results-output");
    displayScreen.textContent = "Rolling 10,000 dice... Please wait! 🎲";
    CalcBtn.disabled = true;

    setTimeout(() => {
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