import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';
import { addAttackerModule, syncAppUI, buildRosterFromJSON } from './ui-manager.js';

const CalcBtn = document.getElementById("calculate-btn");
const AddAttackerBtn = document.getElementById("add-attacker-btn");
const RosterContainer = document.getElementById("attacker-roster");
const ChartToggle = document.getElementById("chart-toggle");
const ExportBtn = document.getElementById("export-roster-btn");
const RosterNameInput = document.getElementById("roster-name");
const ImportBtn = document.getElementById("import-roster-btn");
const ImportInput = document.getElementById("import-file-input");

let damageChartInstance = null;
let currentSimulationResults = null;


addAttackerModule(RosterContainer);


RosterContainer.addEventListener("input", syncAppUI);
RosterContainer.addEventListener("change", syncAppUI);

AddAttackerBtn.addEventListener("click", () => {
    addAttackerModule(RosterContainer);
    syncAppUI();
});

if (ChartToggle) {
    ChartToggle.addEventListener("change", (e) => {
        if (currentSimulationResults) {
            renderChart(currentSimulationResults.distribution, e.target.value);
        }
    });
}

// get needed data
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
    const reductionDrop = document.getElementById("def-reduce-dam") ? document.getElementById("def-reduce-dam").value : "none";

    const modifiers = {
        minusOneHit: document.getElementById("def-minus-hit") ? document.getElementById("def-minus-hit").checked : false,
        minusOneWound: document.getElementById("def-minus-wound") ? document.getElementById("def-minus-wound").checked : false,
        minusOneWoundHighStr: document.getElementById("def-minus-wound-str") ? document.getElementById("def-minus-wound-str").checked : false,
        cover: document.getElementById("def-cover") ? document.getElementById("def-cover").checked : false,
        halfDamage: reductionDrop === "half",
        minusOneDamage: reductionDrop === "minus1",
    };

    return new Unit(toughness, wounds, save, inVul, fnp, modelCount, modifiers);
}

// execution
CalcBtn.addEventListener("click", () => {
    CalcBtn.textContent = "Rolling 10,000 dice... 🎲";
    CalcBtn.disabled = true;

    setTimeout(() => {
        const attackerWeapons = createWeaponsArray();
        const targetUnit = createUnit();
        const results = runSimulation(10000, attackerWeapons, targetUnit);

        currentSimulationResults = results;

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

        const currentMode = ChartToggle ? ChartToggle.value : 'exact';
        renderChart(results.distribution, currentMode);

        CalcBtn.textContent = "Run 10,000 Simulations";
        CalcBtn.disabled = false;

    }, 50);
});

// -charts
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

    for (let i = minDamage; i <= maxDamage; i++) {
        chartLabels.push(i);
        const occurrenceCount = distribution[i] || 0;
        exactData.push((occurrenceCount / 10000) * 100);
    }

    let runningTotal = 0;
    for (let i = exactData.length - 1; i >= 0; i--) {
        runningTotal += exactData[i];
        cumulativeData[i] = runningTotal;
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
                    max: isCumulative ? 100 : undefined
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
                        label: function (context) {
                            const index = context.dataIndex;
                            const exactVal = exactData[index].toFixed(2) + '%';
                            const cumVal = cumulativeData[index].toFixed(2) + '%';

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

// export
function exportRoster() {
    const weaponsArray = createWeaponsArray();
    const jsonString = JSON.stringify(weaponsArray, null, 2);

    let fileName = RosterNameInput.value.trim();
    if (!fileName.endsWith(".json")) {
        fileName += ".json";
    }

    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

if (ExportBtn) ExportBtn.addEventListener("click", exportRoster);

// import
if (ImportBtn && ImportInput) {

    ImportBtn.addEventListener("click", () => {
        ImportInput.click();
    });


    ImportInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();


        reader.onload = (e) => {
            try {
                const rawText = e.target.result;
                const jsonData = JSON.parse(rawText);


                buildRosterFromJSON(RosterContainer, jsonData);


                ImportInput.value = "";
            } catch (error) {
                alert("Invalid JSON file! Could not parse roster.");
                console.error(error);
            }
        };


        reader.readAsText(file);
    });
}
