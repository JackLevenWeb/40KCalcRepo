import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';
import { addAttackerModule, syncAppUI, buildRosterFromJSON, spawnReportCard } from './ui-manager.js';
import { initDataBase, loadDataIntoSQL, queryComparisonData, clearDataBase, ModLabels } from './db-manager.js';
const SIMULATION_ITERATIONS = 50000;

const CalcBtn = document.getElementById("calculate-btn");
const AddAttackerBtn = document.getElementById("add-attacker-btn");
const RosterContainer = document.getElementById("attacker-roster");
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


// get needed data
function createWeaponsArray() {
    const modules = document.querySelectorAll('.attacker-module');
    const weaponsArray = [];

    modules.forEach(module => {
        const unitName = module.querySelector(".in-unit-name").value.trim();
        const attack = module.querySelector(".in-attacks").value.trim().toUpperCase() || "1";
        const damage = module.querySelector(".in-dam").value.trim().toUpperCase() || "1";
        const bsws = module.querySelector(".in-bsws").value.trim().toUpperCase();
        const strength = parseInt(module.querySelector(".in-str").value, 10);
        const ap = parseInt(module.querySelector(".in-ap").value, 10);
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



const SIMULATION_SCENARIOS = {
    "Hit Mods": ["hit_plus_1", "reroll_hits_1", "reroll_hits_all", "sustained_hits"],
    "Wound Mods": ["wound_plus_1", "reroll_wounds_1", "reroll_wounds_all", "lethal"],
    "Save/Ap": ["extra_ap_1"],
    "Damage Mods": ["devastating"]
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

// redundancy filter
function isModRedundant(weaponsArray, modKey) {
    return weaponsArray.some(w => {
        if (modKey === "hit_plus_1") return w.modifiers.hitMod > 0;
        if (modKey === "reroll_hits_1") return w.modifiers.rerollHits === "ones" || w.modifiers.rerollHits === "all";
        if (modKey === "reroll_hits_all") return w.modifiers.rerollHits === "all";
        if (modKey === "sustained_hits") return w.modifiers.sustained > 0;
        if (modKey === "wound_plus_1") return w.modifiers.woundMod > 0;
        if (modKey === "reroll_wounds_1") return w.modifiers.rerollWounds === "ones" || w.modifiers.rerollWounds === "all";
        if (modKey === "reroll_wounds_all") return w.modifiers.rerollWounds === "all";
        if (modKey === "lethal") return w.modifiers.lethal === true;
        if (modKey === "devastating") return w.modifiers.devastating === true;
        return false;
    });
}

// ui helper - specific stats data goes where and when
function buildBaseStatsHTML(weaponsArray, targetUnit) {
    // target Stats
    let targetMods = [];
    if (targetUnit.modifiers.minusOneHit) targetMods.push("-1 to Hit");
    if (targetUnit.modifiers.minusOneWound) targetMods.push("-1 to Wound");
    if (targetUnit.modifiers.minusOneWoundHighStr) targetMods.push("S>T -1 Wound");
    if (targetUnit.modifiers.cover) targetMods.push("Cover");
    if (targetUnit.modifiers.halfDamage) targetMods.push("Half Damage");
    if (targetUnit.modifiers.minusOneDamage) targetMods.push("-1 Damage");
    if (targetUnit.fnp && targetUnit.fnp > 1) targetMods.push(`FNP ${targetUnit.fnp}+`);

    let targetModsStr = targetMods.length > 0 ? targetMods.join(' | ') : "[No Mods]";

    let html = `
        <div style="margin-bottom: 10px;">
            <strong style="color: #9ac1df;">TARGET:</strong><br>
            T${targetUnit.toughness} | W${targetUnit.wounds} | SV ${targetUnit.save}+ | Invul ${targetUnit.inVul ? targetUnit.inVul + '+' : 'None'} <br>
            <span style="color: #E63946; font-size: 0.8rem; font-weight: bold;">${targetModsStr}</span>
        </div>
        <strong style="color: #9ac1df;">ATTACKER(S):</strong>
    `;

    // attacker Stats 
    weaponsArray.forEach(w => {
        let activeMods = [];
        if (w.modifiers.lethal) activeMods.push("Lethal");
        if (w.modifiers.devastating) activeMods.push("Dev Wounds");
        if (w.modifiers.sustained > 0) activeMods.push(`Sustained ${w.modifiers.sustained}`);
        if (w.modifiers.rerollHits !== "none") activeMods.push(`RR Hits`);
        if (w.modifiers.rerollWounds !== "none") activeMods.push(`RR Wounds`);
        if (w.modifiers.anti > 0) activeMods.push(`Anti-${w.modifiers.anti}+`);
        if (w.modifiers.lance) activeMods.push("Lance");
        if (w.modifiers.rapidFire > 0) activeMods.push(`Rapid Fire ${w.modifiers.rapidFire}`);
        if (w.modifiers.melta > 0) activeMods.push(`Melta ${w.modifiers.melta}`);
        if (w.modifiers.torrent) activeMods.push("Torrent");
        if (w.modifiers.twinLinked) activeMods.push("Twin-Linked");
        if (w.modifiers.blast) activeMods.push("Blast");
        if (w.modifiers.cleave) activeMods.push("Cleave");
        if (w.modifiers.hitMod > 0) activeMods.push(`+${w.modifiers.hitMod} Hit`);
        if (w.modifiers.hitMod < 0) activeMods.push(`${w.modifiers.hitMod} Hit`);
        if (w.modifiers.woundMod > 0) activeMods.push(`+${w.modifiers.woundMod} Wound`);
        if (w.modifiers.woundMod < 0) activeMods.push(`${w.modifiers.woundMod} Wound`);

        let modsStr = activeMods.length > 0 ? `[${activeMods.join(', ')}]` : `[No Mods]`;

        html += `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #38424D;">
                <strong style="color: #fff; font-size: 1.05rem;">${w.unitName} - Base Stats</strong><br>
                <span style="color: #8C9BA8; line-height: 1.4;">
                    ${w.unitCount * w.modelCount} Models<br>
                    ${w.attack} Attacks per model<br>
                    BS/WS ${w.BsWs}+ <br>
                    Strength ${w.strength} <br>
                    AP ${w.Ap}
                </span><br>
                <div style="color: #C48235; font-size: 0.8rem; font-weight: bold; margin-top: 4px;">
                    ${modsStr}
                </div>
            </div>
        `;
    });
    return html;

}


// add an allowedMods parameter so we can filter out graph mods contamination
// report generator
function generateAdvancedReport(title, category, sqlData, totalRuns, allowedMods, statsHTML) {
    const container = document.getElementById("advanced-reports-container");
    const card = spawnReportCard(title, container, statsHTML);
    renderAdvancedChart(card.querySelector('.adv-chart'), category, sqlData, totalRuns, allowedMods);
}

// execution
//standard btn
if (CalcBtn) {
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


            renderChart(results.distribution, results.SimulatedRuns);

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
}

//ADV PIPELINE ORCHESTRATOR LOOP
// adv analytics button here>>
if (advAnalyticsBtn) {
    advAnalyticsBtn.addEventListener("click", async () => {
        advAnalyticsBtn.textContent = "Running Pipeline...";
        advAnalyticsBtn.disabled = true;
        clearDataBase();



        document.getElementById("results-wrapper").style.display = "none";
        document.getElementById("advanced-analytics-wrapper").style.display = "block";
        document.getElementById("advanced-reports-container").innerHTML = "";

        const baseWeapons = createWeaponsArray();
        const targetUnit = createUnit();

        try {
            // base
            for (const baseWeapon of baseWeapons) {
                const unitName = baseWeapon.unitName;

                ModLabels["Base"] = `Base Profile (AP ${baseWeapon.Ap})`;
                ModLabels["extra_ap_1"] = `AP ${baseWeapon.Ap - 1}`;


                let statsHTML = buildBaseStatsHTML([baseWeapon], targetUnit);

                //track allowed mods per unit
                let allowedHitMods = ["Base"];
                let allowedWoundMods = ["Base"];
                let allowedSaveMods = ["Base"];
                let allowedDamageMods = ["Base"];
                let allowedKilledMods = ["Base"];

                let singleWeaponRoster = [baseWeapon];
                let baseResults = await runWorkerSimulation(SIMULATION_ITERATIONS, singleWeaponRoster, targetUnit);

                loadDataIntoSQL(unitName, "Base", "Hit", baseResults.hitDistribution);
                loadDataIntoSQL(unitName, "Base", "Wound", baseResults.woundDistribution);
                loadDataIntoSQL(unitName, "Base", "Save", baseResults.saveDistribution);
                loadDataIntoSQL(unitName, "Base", "Damage", baseResults.damageDistribution);
                loadDataIntoSQL(unitName, "Base", "ModelsKilled", baseResults.killedDistribution);
                for (const [category, mods] of Object.entries(SIMULATION_SCENARIOS)) {
                    for (const modKey of mods) {

                        if (isModRedundant([baseWeapon], modKey)) continue;
                        if (category === "Hit Mods") allowedHitMods.push(modKey);
                        if (category === "Wound Mods") allowedWoundMods.push(modKey);
                        if (category === "Save/Ap") allowedSaveMods.push(modKey);
                        if (category === "Damage Mods") {
                            allowedDamageMods.push(modKey);
                            allowedKilledMods.push(modKey);
                        }

                        let moddedWeapon = JSON.parse(JSON.stringify(baseWeapon));
                        applyModifierToWeapon(moddedWeapon, modKey);

                        let results = await runWorkerSimulation(SIMULATION_ITERATIONS, [moddedWeapon], targetUnit);

                        loadDataIntoSQL(unitName, modKey, "Hit", results.hitDistribution);
                        loadDataIntoSQL(unitName, modKey, "Wound", results.woundDistribution);
                        loadDataIntoSQL(unitName, modKey, "Save", results.saveDistribution);
                        loadDataIntoSQL(unitName, modKey, "Damage", results.damageDistribution);
                        loadDataIntoSQL(unitName, modKey, "ModelsKilled", results.killedDistribution);

                    }
                }

                // query the Database and Draw the 5 Charts for THIS unit
                const sqlData = queryComparisonData(unitName);



                generateAdvancedReport(`${unitName}: Hit`, "Hit", sqlData, SIMULATION_ITERATIONS, allowedHitMods, statsHTML);
                generateAdvancedReport(`${unitName}: Wound`, "Wound", sqlData, SIMULATION_ITERATIONS, allowedWoundMods, statsHTML);
                generateAdvancedReport(`${unitName}: Save`, "Save", sqlData, SIMULATION_ITERATIONS, allowedSaveMods, statsHTML);
                generateAdvancedReport(`${unitName}: Damage`, "Damage", sqlData, SIMULATION_ITERATIONS, allowedDamageMods, statsHTML);
                generateAdvancedReport(`${unitName}: ModelsKilled`, "ModelsKilled", sqlData, SIMULATION_ITERATIONS, allowedKilledMods, statsHTML);


            }
        } catch (error) {
            console.error("Pipeline Failed:", error);
            alert("Pipeline Failed.");
        }

        advAnalyticsBtn.textContent = "Run Advanced Analytics";
        advAnalyticsBtn.disabled = false;
    });
}



// standard chart
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


    // const yAxisLabel = isCumulative ? 'Chance to Deal THIS OR MORE (%)' : 'Chance to Deal EXACTLY THIS (%)';

    damageChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Exactly This Damage',
                    data: exactData,
                    borderColor: '#9ac1df', // --sw-light-blue
                    backgroundColor: 'rgba(154, 193, 223, 0.15)',
                    borderWidth: 2,
                    pointBackgroundColor: '#0F1115',
                    pointBorderColor: '#9ac1df',
                    pointHoverBackgroundColor: '#9ac1df',
                    pointHoverBorderColor: '#9ac1df',
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'At Least This Damage',
                    data: cumulativeData,
                    borderColor: '#C48235', // --accent-bronze
                    backgroundColor: 'rgba(196, 130, 53, 0.15)',
                    borderWidth: 2,
                    pointBackgroundColor: '#0F1115',
                    pointBorderColor: '#C48235',
                    pointHoverBackgroundColor: '#C48235',
                    pointHoverBorderColor: '#C48235',
                    pointRadius: 2,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest', // closest line to cursor
                intersect: false
            },
            scales: {
                x: {
                    title: { display: true, text: 'Total Damage Dealt', color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: { color: '#9ac1df' },
                    grid: { color: '#38424D' }
                },
                y: {
                    title: { display: true, text: 'Probability (%)', color: '#8C9BA8', font: { weight: 'bold' } },
                    ticks: {
                        color: '#9ac1df',
                        callback: function (value) { return value + '%'; }
                    },
                    grid: { color: '#38424D' },
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#fff' }
                },
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
                            return context.dataset.label + ': ' + context.raw.toFixed(2) + '%';
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

        const cumulativeArray = [];
        let runningTotal = 0;

        for (let i = dataArray.length - 1; i >= 0; i--) {
            runningTotal += dataArray[i];
            cumulativeArray[i] = runningTotal;


        }

        const colors = ['#8C9BA8', '#9B2226', '#9ac1df', '#C48235', '#55efc4'];
        return {
            label: ModLabels[modName] || modName,
            data: cumulativeArray,
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
            interaction: { mode: 'nearest', intersect: false },
            scales: {
                x: { title: { display: true, text: `Total Successful ${category}s`, color: '#8C9BA8', font: { weight: 'bold' } }, ticks: { color: '#9ac1df' }, grid: { color: '#38424D' } },
                y: { title: { display: true, text: `At Least - (%) Chance of ${category}`, color: '#8C9BA8', font: { weight: 'bold' } }, ticks: { color: '#9ac1df' }, grid: { color: '#38424D' }, beginAtZero: true }
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
