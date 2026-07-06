import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';
import { addAttackerModule, syncAppUI, buildRosterFromJSON, spawnReportCard } from './ui-manager.js';
import { initDataBase, loadDataIntoSQL, queryComparisonData, clearDataBase, ModLabels } from './db-manager.js';
const SIMULATION_ITERATIONS = 50000;

const CalcBtn = document.getElementById("calculate-btn");
const AddAttackerBtn = document.getElementById("add-attacker-btn");
const RosterContainer = document.getElementById("attacker-roster");
const ChartToggle = document.getElementById("chart-toggle");
const ExportBtn = document.getElementById("export-roster-btn");
const RosterNameInput = document.getElementById("roster-name");
const ImportBtn = document.getElementById("import-roster-btn");
const ImportInput = document.getElementById("import-file-input");
const advAnalyticsBtn = document.getElementById("advanced-analytics-btn");

let damageChartInstance = null;
let currentSimulationResults = null;

initDataBase();


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

//async worker
function runWorkerSimulation(iterations, weaponsArray, targetUnit) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./webWorker.js', import.meta.url), { type: 'module' });

        worker.addEventListener('message', (event) => {

            const results = event.data;
            worker.terminate();
            resolve(results);


        });

        worker.addEventListener('error', (error) => {
            worker.terminate();
            reject(error);

        });

        worker.postMessage({ iterations, weaponsArray, targetUnit });
    });



}

// execution
CalcBtn.addEventListener("click", () => {
    CalcBtn.textContent = "Rolling dice...";
    CalcBtn.disabled = true;
    const attackerWeapons = createWeaponsArray();
    const targetUnit = createUnit();

    const worker = new Worker(new URL('./webWorker.js', import.meta.url), { type: 'module' });

    worker.addEventListener('error', (error) => {
        console.error("PIPELINE CRASH:", error.message);
        CalcBtn.textContent = "Pipeline Error (Check Console)";
        CalcBtn.disabled = false;
        worker.terminate();
    });

    worker.addEventListener('message', (event) => {
        const results = event.data;
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
        renderChart(results.distribution, results.SimulatedRuns, currentMode);

        CalcBtn.textContent = "FOR THE EMPEROR!";
        CalcBtn.disabled = false;
        worker.terminate();

    });


    worker.postMessage({
        iterations: SIMULATION_ITERATIONS, // running 50k now instead of 10k
        weaponsArray: attackerWeapons,
        targetUnit: targetUnit
    });



});

const SIMULATION_SCENARIOS = {
    "Hit Mods": ["hit_plus_1", "reroll_hits_1", "reroll_hits_all", "sustained_hits"],
    "Wound Mods": ["wound_plus_1", "reroll_wounds_1", "reroll_wounds_all", "lethal"],
    "Save/Ap": ["extra_ap_1", "devastating"]
};

function applyModifierToWeapon(weapon, modKey) {
    if (modKey === "hit_plus_1") weapon.modifiers.hitMod += 1;
    if (modKey === "reroll_hits_1") weapon.modifiers.rerollHits = "ones";
    if (modKey === "reroll_hits_all") weapon.modifiers.rerollHits = "all";
    if (modKey === "sustained_hits") weapon.modifiers.sustained = 1;

    if (modKey === "wound_plus_1") weapon.modifiers.woundMod += 1;
    if (modKey === "reroll_wounds_1") weapon.modifiers.rerollWounds = "ones";
    if (modKey === "reroll_wounds_all") weapon.modifiers.rerollWounds = "all";
    if (modKey === "lethal") weapon.modifiers.lethal = true;

    if (modKey === "extra_ap_1") weapon.Ap -= 1;
    if (modKey === "devastating") weapon.modifiers.devastating = true;
}

// report generator
// add an allowedMods parameter so we can filter out graph mods contamination
function generateAdvancedReport(category, sqlData, totalRuns, allowedMods) {
    const container = document.getElementById("advanced-reports-container");
    const card = spawnReportCard(container, category);
    renderAdvancedChart(card.querySelector('.adv-chart'), category, sqlData, totalRuns, allowedMods);
}

//ADV PIPELINE ORCHESTRATOR LOOP >>> might be some issues in here...
//adv analytics button here>>
if (advAnalyticsBtn) {
    advAnalyticsBtn.addEventListener("click", async () => {
        advAnalyticsBtn.textContent = "Running Pipeline...";
        advAnalyticsBtn.disabled = true;
        clearDataBase();

        const targetUnit = createUnit();


        document.getElementById("results-wrapper").style.display = "none";
        document.getElementById("advanced-analytics-wrapper").style.display = "block";


        document.getElementById("advanced-reports-container").innerHTML = "";


        try {
            // base
            let baseWeapons = createWeaponsArray();
            let baseResults = await runWorkerSimulation(SIMULATION_ITERATIONS, baseWeapons, targetUnit);
            loadDataIntoSQL("Base", "Hit", baseResults.hitDistribution);
            loadDataIntoSQL("Base", "Wound", baseResults.woundDistribution);
            loadDataIntoSQL("Base", "Save", baseResults.saveDistribution);

            // scenarios
            for (const [category, mods] of Object.entries(SIMULATION_SCENARIOS)) {
                for (const modKey of mods) {
                    let weapons = createWeaponsArray();
                    weapons.forEach(w => applyModifierToWeapon(w, modKey));
                    let results = await runWorkerSimulation(SIMULATION_ITERATIONS, weapons, targetUnit);

                    loadDataIntoSQL(modKey, "Hit", results.hitDistribution);
                    loadDataIntoSQL(modKey, "Wound", results.woundDistribution);
                    loadDataIntoSQL(modKey, "Save", results.saveDistribution);
                }
            }

            const sqlData = queryComparisonData();

            // specific allowed modifiers to stop contamination!
            generateAdvancedReport("Hit", sqlData, SIMULATION_ITERATIONS, ["Base", ...SIMULATION_SCENARIOS["Hit Mods"]]);
            generateAdvancedReport("Wound", sqlData, SIMULATION_ITERATIONS, ["Base", ...SIMULATION_SCENARIOS["Wound Mods"]]);
            generateAdvancedReport("Save", sqlData, SIMULATION_ITERATIONS, ["Base", ...SIMULATION_SCENARIOS["Save/Ap"]]);

        } catch (error) {
            console.error("Pipeline Failed:", error);
            alert("Pipeline Failed.");
        }
        advAnalyticsBtn.textContent = "Run Advanced Analytics";
        advAnalyticsBtn.disabled = false;
    });

}



// chart
function renderChart(distribution, totalRuns, mode = 'exact') {
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
        exactData.push((occurrenceCount / totalRuns) * 100);
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

// advChart
export function renderAdvancedChart(canvasElement, category, sqlRows, totalRuns, allowedMods) {
    const ctx = canvasElement.getContext('2d');

    // only allow rows matching the category AND allowed mods
    const categoryRows = sqlRows.filter(r => r[2] === category && allowedMods.includes(r[0]));

    // fix the X-Axis scale
    let minVal = 999, maxVal = 0;
    categoryRows.forEach(r => {
        if (r[1] < minVal) minVal = r[1];
        if (r[1] > maxVal) maxVal = r[1];
    });

    const chartLabels = [];
    for (let i = minVal; i <= maxVal; i++) chartLabels.push(i);

    //  build
    const datasets = allowedMods.map((modName, index) => {
        const modRows = categoryRows.filter(r => r[0] === modName);

        // map exact values to the X-Axis so lines draw correctly
        const dataArray = chartLabels.map(label => {
            const row = modRows.find(r => r[1] === label);
            return row ? (row[3] / totalRuns) * 100 : 0;
        });

        const colors = ['#8C9BA8', '#9B2226', '#9ac1df', '#C48235', '#55efc4'];
        return {
            label: ModLabels[modName] || modName,
            data: dataArray,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '22',
            fill: true,
            borderWidth: 2, tension: 0.3, pointRadius: 0, pointHoverRadius: 5
        };
    });

    // draw
    new Chart(ctx, {
        type: 'line',
        data: { labels: chartLabels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { title: { display: true, text: `Total Successful ${category}s`, color: '#8C9BA8', font: { weight: 'bold' } }, ticks: { color: '#9ac1df' }, grid: { color: '#38424D' } },
                y: { title: { display: true, text: 'Chance (%)', color: '#8C9BA8', font: { weight: 'bold' } }, ticks: { color: '#9ac1df' }, grid: { color: '#38424D' }, beginAtZero: true }
            },
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.95)', titleColor: '#9ac1df', bodyColor: '#DAE6EF',
                    borderColor: '#C48235', borderWidth: 1, padding: 12,
                    callbacks: {
                        label: function (context) { return context.dataset.label + ': ' + context.raw.toFixed(2) + '%'; }
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
//button for above
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
