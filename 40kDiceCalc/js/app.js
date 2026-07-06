import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';

const CalcBtn = document.getElementById("calculate-btn");
const AddAttackerBtn = document.getElementById("add-attacker-btn");
const RosterContainer = document.getElementById("attacker-roster");

let damageChartInstance = null;
let currentSimulationResults = null; // Saves the data so we can toggle graph views instantly!

// --- THE MODIFIER DICTIONARY ---
const ModifierDictionary = {
    "lethal": { name: "Lethal Hits", hasInput: false },
    "devastating": { name: "Devastating Wounds", hasInput: false },
    "lance": { name: "Lance", hasInput: false },
    "torrent": { name: "Torrent", hasInput: false },
    "twinlinked": { name: "Twin-Linked", hasInput: false },
    "blast": { name: "Blast", hasInput: false },
    "cleave": { name: "Cleave", hasInput: false },
    "sustained": { name: "Sustained", hasInput: true, defaultVal: 1 },
    "melta": { name: "Melta", hasInput: true, defaultVal: 2 },
    "anti": { name: "Anti-X", hasInput: true, defaultVal: 4 },
    "rapidfire": { name: "Rapid Fire", hasInput: true, defaultVal: 1 },
    "hit_plus_1": { name: "+1 to Hit", hasInput: false },
    "hit_minus_1": { name: "-1 to Hit", hasInput: false },
    "wound_plus_1": { name: "+1 to Wound", hasInput: false },
    "wound_minus_1": { name: "-1 to Wound", hasInput: false },
    "reroll_hits_1": { name: "Reroll 1s (Hit)", hasInput: false },
    "reroll_hits_all": { name: "Reroll All (Hit)", hasInput: false },
    "reroll_wounds_1": { name: "Reroll 1s (Wound)", hasInput: false },
    "reroll_wounds_all": { name: "Reroll All (Wound)", hasInput: false }
};

// Initialize
addAttackerModule();

// --- REACTIVE UI EVENT LISTENER ---
RosterContainer.addEventListener("input", syncAppUI);
RosterContainer.addEventListener("change", syncAppUI);

// Graph Toggle Listener
document.getElementById("chart-toggle").addEventListener("change", (e) => {
    if (currentSimulationResults) {
        renderChart(currentSimulationResults.distribution, e.target.value);
    }
});

// --- 1. UI GENERATION ---
AddAttackerBtn.addEventListener("click", () => {
    addAttackerModule();
    syncAppUI();
});

function addAttackerModule() {
    const moduleHTML = `
      <div class="attacker-module" style="background: var(--bg-color); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 15px;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div class="input-field" style="flex-grow: 1; margin-right: 15px;">
                <input type="text" class="in-unit-name" value="Attacker Unit" style="font-weight: bold; font-size: 1.2rem; color: var(--sw-light-blue); border: none; border-bottom: 1px solid var(--sw-mid-blue); border-radius: 0; padding: 5px 0; background: transparent; box-shadow: none;" />
                <div class="attached-leaders-display" style="color: var(--sw-light-blue); font-size: 0.85rem; font-weight: bold; margin-top: 5px;"></div>
            </div>
            <button class="remove-btn" style="background: var(--sw-light-blue); color: #0F1115; border: 1px solid var(--sw-mid-blue); border-radius: 4px; cursor: pointer; padding: 5px 10px; font-weight: bold;">X</button>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="cursor: pointer; color: var(--sw-light-blue); font-weight: bold; font-size: 0.9rem; text-transform: uppercase;">
             <input type="checkbox" class="is-leader" style="margin-right: 5px;"> 👑 Declare Leader
          </label>
        </div>

        <div class="leader-options" style="display: none; background: var(--surface-hover); padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid var(--sw-mid-blue);">
          <div class="core-stats-row">
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
                    <option value="lance">Lance</option>
                    <option value="reroll_hits_1">Reroll 1s to Hit</option>
                    <option value="reroll_wounds_1">Reroll 1s to Wound</option>
                 </select>
              </div>
          </div>
        </div>

        <h4>Core Profile</h4>
        <div class="core-stats-row">
          <div class="input-field"><label>Units</label><input type="number" class="in-units" value="1" min="1" /></div>
          <div class="input-field"><label>Models</label><input type="number" class="in-models" value="5" min="1" /></div>
          <div class="input-field"><label>Attacks</label><input type="number" class="in-attacks" value="4" min="1" /></div>
          <div class="input-field"><label>BS/WS</label><input type="text" class="in-bsws" value="3" placeholder="NA" /></div>
          <div class="input-field"><label>Strength</label><input type="number" class="in-str" value="4" min="1" /></div>
          <div class="input-field"><label>AP</label><input type="number" class="in-ap" value="-1" max="0" /></div>
          <div class="input-field"><label>Damage</label><input type="text" class="in-dam" value="1" placeholder="D6+1" /></div>
          <div class="input-field"><label>Crit Hit</label><input type="number" class="in-crit-hit" value="6" min="2" max="6" /></div>
          <div class="input-field"><label>Crit Wnd</label><input type="number" class="in-crit-wound" value="6" min="2" max="6" /></div>
        </div>

        <h4>Active Modifiers</h4>
        <div class="modifier-adder-row">
            <select class="mod-dropdown" style="flex-grow: 1;">
                <option value="none">-- Select a Rule to Add --</option>
                <optgroup label="Weapon Rules">
                    <option value="lethal">Lethal Hits</option>
                    <option value="devastating">Devastating Wounds</option>
                    <option value="sustained">Sustained Hits</option>
                    <option value="melta">Melta</option>
                    <option value="anti">Anti-X</option>
                    <option value="rapidfire">Rapid Fire</option>
                    <option value="lance">Lance</option>
                    <option value="torrent">Torrent</option>
                    <option value="twinlinked">Twin-Linked</option>
                    <option value="blast">Blast</option>
                    <option value="cleave">Cleave</option>
                </optgroup>
                <optgroup label="Flat Modifiers">
                    <option value="hit_plus_1">+1 to Hit</option>
                    <option value="hit_minus_1">-1 to Hit</option>
                    <option value="wound_plus_1">+1 to Wound</option>
                    <option value="wound_minus_1">-1 to Wound</option>
                </optgroup>
                <optgroup label="Rerolls">
                    <option value="reroll_hits_1">Reroll 1s to Hit</option>
                    <option value="reroll_hits_all">Reroll All Hits</option>
                    <option value="reroll_wounds_1">Reroll 1s to Wound</option>
                    <option value="reroll_wounds_all">Reroll All Wounds</option>
                </optgroup>
            </select>
            <button class="btn-primary add-mod-btn">Add Rule</button>
        </div>
        
        <div class="active-modifiers-list"></div>

      </div>
    `;

    RosterContainer.insertAdjacentHTML('beforeend', moduleHTML);
    const newModule = RosterContainer.lastElementChild;

    newModule.querySelector(".remove-btn").addEventListener("click", () => {
        if (document.querySelectorAll('.attacker-module').length > 1) {
            newModule.remove();
            syncAppUI();
        } else {
            alert("The pack must have at least one attacker!");
        }
    });

    newModule.querySelector(".add-mod-btn").addEventListener("click", () => {
        const select = newModule.querySelector(".mod-dropdown");
        const modKey = select.value;
        if (modKey !== "none") {
            addBadgeToModule(newModule, modKey, false);
            select.value = "none";
            syncAppUI();
        }
    });
}

function addBadgeToModule(moduleNode, modKey, isGranted) {
    const list = moduleNode.querySelector(".active-modifiers-list");
    if (list.querySelector(`.mod-badge[data-key="${modKey}"]`)) return;

    const modData = ModifierDictionary[modKey];
    if (!modData) return;

    const badge = document.createElement("div");
    badge.className = "mod-badge";
    badge.dataset.key = modKey;
    if (isGranted) badge.dataset.granted = "true";

    let innerHTML = `<span>${modData.name}</span>`;

    if (modData.hasInput) {
        innerHTML += `<input type="number" class="badge-val" value="${modData.defaultVal}" min="1" ${isGranted ? 'disabled' : ''} />`;
    }

    if (!isGranted) {
        innerHTML += `<button class="remove-mod-btn">×</button>`;
    }

    badge.innerHTML = innerHTML;

    if (!isGranted) {
        badge.querySelector(".remove-mod-btn").addEventListener("click", () => {
            badge.remove();
            syncAppUI();
        });
    }

    list.appendChild(badge);
}


// --- 2. THE REACTIVITY ENGINE ---
function syncAppUI() {
    const modules = document.querySelectorAll('.attacker-module');
    const allNames = Array.from(modules).map(m => m.querySelector('.in-unit-name').value.trim());

    modules.forEach(module => {
        module.querySelector('.in-units').disabled = false;
        module.querySelector('.attached-leaders-display').innerHTML = '';
        module.querySelectorAll('.mod-badge[data-granted="true"]').forEach(b => b.remove());

        const isLeader = module.querySelector('.is-leader').checked;
        module.querySelector('.leader-options').style.display = isLeader ? "block" : "none";

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
    });

    modules.forEach(leaderModule => {
        const isLeader = leaderModule.querySelector('.is-leader').checked;
        const targetName = leaderModule.querySelector('.attach-to').value;
        const granted = leaderModule.querySelector('.grant-keyword').value;
        const leaderName = leaderModule.querySelector('.in-unit-name').value.trim();

        if (isLeader && targetName) {
            const targetModule = Array.from(modules).find(m => m.querySelector('.in-unit-name').value.trim() === targetName);

            if (targetModule) {
                targetModule.querySelector('.attached-leaders-display').innerHTML += `🛡️ Led by: ${leaderName}`;
                targetModule.querySelector('.in-units').value = 1;
                targetModule.querySelector('.in-units').disabled = true;

                if (granted !== "none") {
                    addBadgeToModule(targetModule, granted, true);
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
        const bsws = module.querySelector(".in-bsws").value.trim().toUpperCase();
        const strength = parseInt(module.querySelector(".in-str").value, 10);
        const ap = parseInt(module.querySelector(".in-ap").value, 10);
        const damage = module.querySelector(".in-dam").value.trim().toUpperCase() || "1";
        const modelCount = parseInt(module.querySelector(".in-models").value, 10);
        const unitCount = parseInt(module.querySelector(".in-units").value, 10);

        const hasMod = (key) => module.querySelector(`.mod-badge[data-key="${key}"]`) !== null;
        const getModVal = (key) => {
            const badge = module.querySelector(`.mod-badge[data-key="${key}"]`);
            return badge ? parseInt(badge.querySelector(".badge-val").value, 10) : 0;
        };

        let hitModTotal = 0;
        if (hasMod("hit_plus_1")) hitModTotal += 1;
        if (hasMod("hit_minus_1")) hitModTotal -= 1;

        let woundModTotal = 0;
        if (hasMod("wound_plus_1")) woundModTotal += 1;
        if (hasMod("wound_minus_1")) woundModTotal -= 1;

        let finalRerollHits = "none";
        if (hasMod("reroll_hits_all")) finalRerollHits = "all";
        else if (hasMod("reroll_hits_1")) finalRerollHits = "ones";

        let finalRerollWounds = "none";
        if (hasMod("reroll_wounds_all")) finalRerollWounds = "all";
        else if (hasMod("reroll_wounds_1")) finalRerollWounds = "ones";

        const modifiers = {
            critHitThreshold: module.querySelector(".in-crit-hit") ? parseInt(module.querySelector(".in-crit-hit").value, 10) : 6,
            critWoundThreshold: module.querySelector(".in-crit-wound") ? parseInt(module.querySelector(".in-crit-wound").value, 10) : 6,
            hitMod: hitModTotal,
            woundMod: woundModTotal,
            rerollHits: finalRerollHits,
            rerollWounds: finalRerollWounds,
            lethal: hasMod("lethal"),
            devastating: hasMod("devastating"),
            lance: hasMod("lance"),
            torrent: hasMod("torrent"),
            twinLinked: hasMod("twinlinked"),
            blast: hasMod("blast"),
            cleave: hasMod("cleave"),
            sustained: getModVal("sustained"),
            melta: getModVal("melta"),
            anti: getModVal("anti"),
            rapidFire: getModVal("rapidfire")
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

    const reductionDrop = document.getElementById("def-reduce-dam").value;

    const modifiers = {
        minusOneHit: document.getElementById("def-minus-hit").checked,
        minusOneWound: document.getElementById("def-minus-wound").checked,
        minusOneWoundHighStr: document.getElementById("def-minus-wound-str").checked,
        cover: document.getElementById("def-cover").checked,
        halfDamage: reductionDrop === "half",
        minusOneDamage: reductionDrop === "minus1",
    };

    return new Unit(toughness, wounds, save, inVul, fnp, modelCount, modifiers);
}

// --- 4. EXECUTION ---
CalcBtn.addEventListener("click", () => {
    CalcBtn.textContent = "Rolling 10,000 dice... 🎲";
    CalcBtn.disabled = true;

    setTimeout(() => {
        const attackerWeapons = createWeaponsArray();
        const targetUnit = createUnit();
        const results = runSimulation(10000, attackerWeapons, targetUnit);

        currentSimulationResults = results; // Save for graph toggles!

        document.getElementById("results-wrapper").style.display = "grid";

        document.getElementById("stats-html").innerHTML = `
            <div class="stat-card">
                <h5>Average Damage Dealt</h5>
                <div class="stat-value">${results.averages.damage.toFixed(2)}</div>
                <div class="stat-sub">Highest Spike: ${results.extremes.highestDamage}</div>
            </div>
            <div class="stat-card">
                <h5>Average Models Killed</h5>
                <div class="stat-value">${results.averages.killed.toFixed(2)}</div>
                <div class="stat-sub">Max Killed: ${results.extremes.highestKills}</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--accent-red);">
                <h5>Wasted Damage (Overkill)</h5>
                <div class="stat-value">${results.averages.wasted.toFixed(2)}</div>
                <div class="stat-sub">Damage Efficiency: ${results.averages.efficiency}%</div>
            </div>
        `;

        const currentMode = document.getElementById("chart-toggle").value;
        renderChart(results.distribution, currentMode);

        CalcBtn.textContent = "Run 10,000 Simulations";
        CalcBtn.disabled = false;

    }, 50);
});

// --- 5. ANALYTICS & GRAPHING (NOW WITH CUMULATIVE MATH) ---
function renderChart(distribution, mode = 'exact') {
    const ctx = document.getElementById('damageChart').getContext('2d');

    if (damageChartInstance) {
        damageChartInstance.destroy();
    }

    const rawDamageNumbers = Object.keys(distribution).map(Number).sort((a, b) => a - b);
    const minDamage = rawDamageNumbers[0] || 0;
    const maxDamage = rawDamageNumbers[rawDamageNumbers.length - 1] || 0;

    const chartLabels = [];
    const exactData = [];
    const cumulativeData = [];

    // 1. Calculate Exact Percentages
    for (let i = minDamage; i <= maxDamage; i++) {
        chartLabels.push(i);
        const occurrenceCount = distribution[i] || 0;
        exactData.push((occurrenceCount / 10000) * 100);
    }

    // 2. Calculate "At Least" Percentages (Waterfall Math)
    let runningTotal = 0;
    for (let i = exactData.length - 1; i >= 0; i--) {
        runningTotal += exactData[i];
        cumulativeData[i] = runningTotal; // Fills the array backwards!
    }

    const isCumulative = mode === 'cumulative';
    const activeData = isCumulative ? cumulativeData : exactData;
    const yAxisLabel = isCumulative ? 'Chance to Deal THIS OR MORE (%)' : 'Chance to Deal EXACTLY THIS (%)';

    damageChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Damage Probability',
                data: activeData,
                borderColor: '#9ac1df',
                backgroundColor: 'rgba(154, 193, 223, 0.15)',
                borderWidth: 2,
                pointBackgroundColor: '#0F1115',
                pointBorderColor: '#9ac1df',
                pointHoverBackgroundColor: '#C48235',
                pointHoverBorderColor: '#C48235',
                pointRadius: 2,
                pointHoverRadius: 6,
                fill: true,
                // If it's cumulative, remove the smooth curve so it waterfalls accurately!
                tension: isCumulative ? 0.1 : 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    title: { display: true, text: 'Total Damage Dealt', color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: '#9ac1df' },
                    grid: { color: '#38424D' }
                },
                y: {
                    title: { display: true, text: yAxisLabel, color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: {
                        color: '#9ac1df',
                        callback: function (value) { return value + '%'; }
                    },
                    grid: { color: '#38424D' },
                    beginAtZero: true,
                    max: isCumulative ? 100 : undefined // Lock At-Least graphs to 100% height
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)',
                    titleColor: '#9ac1df',
                    bodyColor: '#DAE6EF',
                    borderColor: '#C48235',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        title: function (context) { return 'Damage: ' + context[0].label; },
                        // The Ultimate Tooltip: Always show BOTH stats!
                        label: function (context) {
                            const index = context.dataIndex;
                            const exactVal = exactData[index].toFixed(2) + '%';
                            const cumVal = cumulativeData[index].toFixed(2) + '%';

                            // Reorder the text based on what view you are in
                            if (isCumulative) {
                                return [
                                    'At Least ' + context.label + ' Damage: ' + cumVal,
                                    'Exactly ' + context.label + ' Damage: ' + exactVal
                                ];
                            } else {
                                return [
                                    'Exactly ' + context.label + ' Damage: ' + exactVal,
                                    'At Least ' + context.label + ' Damage: ' + cumVal
                                ];
                            }
                        }
                    }
                }
            }
        }
    });
}