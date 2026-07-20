// main orchestrator file. handles initialization and high-level pipeline execution.

import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';
import { addAttackerModule, syncAppUI, buildRosterFromJSON, spawnReportCard, addBadgeToModule, spawnLeaderboard } from './ui-manager.js';
import { initDataBase, loadDataIntoSQL, queryComparisonData, clearDataBase, ModLabels, loadAveragesIntoSQL, queryAveragesData } from './db-manager.js';
import { renderChart, renderAdvancedChart } from './chart-manager.js';
import { initializeWatchers } from './event-manager.js';
import { applyTheme, getCurrentTheme } from './theme-manager.js';
import './fetchUnitStats.js'
const SIMULATION_ITERATIONS = 100000;

initializeWatchers();

const savedTheme = localStorage.getItem("40kTheme") || "space_wolves";
applyTheme(savedTheme);

document.addEventListener("App:AutoSave", autoSave);
document.addEventListener("App:ExportRoster", exportRoster);
document.addEventListener("App:ImportRoster", (e) => handleImport(e.detail.file));

document.addEventListener("App:ThemeChanged", () => {
    const stdResults = document.getElementById("results-wrapper");
    if (stdResults && stdResults.style.display !== "none" && currentSimulationResults) {
        renderChart(currentSimulationResults.damageDistribution, currentSimulationResults.killedDistribution, currentSimulationResults.SimulatedRuns, currentIsSingleTarget);
    }
});

const CalcBtn = document.getElementById("calculate-btn");
const RosterContainer = document.getElementById("attacker-roster");
const RosterNameInput = document.getElementById("roster-name");
const ImportInput = document.getElementById("import-file-input");
const advAnalyticsBtn = document.getElementById("advanced-analytics-btn");
const ClearBtn = document.getElementById("clear-dashboard-btn");

let currentSimulationResults = null;
let currentIsSingleTarget = false;

initDataBase();

//create weapon array from modules(html elements)
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
        const isLeader = module.querySelector('.is-leader').checked;
        const attachTarget = module.querySelector('.attach-to').value || null;
        const grantedKeyword = module.querySelector('.grant-keyword').value;

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
            rapidFire: getModVal("rapidfire"),
            fishForCrits: hasMod("fish_crits")
        };

        const newWeapon = new Weapon(unitName, attack, bsws, strength, ap, damage, modelCount, unitCount, modifiers);
        newWeapon.isLeader = isLeader;
        newWeapon.attachTarget = attachTarget;
        newWeapon.grantedKeyword = grantedKeyword;

        weaponsArray.push(newWeapon);
    });

    return weaponsArray;
}

//create unit from html elements
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
        plusOneSave: document.getElementById("def-plus-one-save") ? document.getElementById("def-plus-one-save").checked : false
    };

    return new Unit(toughness, wounds, save, inVul, fnp, modelCount, modifiers);
}

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
    "Hit Mods": ["hit_plus_1", "reroll_hits_1", "reroll_hits_all", "sustained_hits", "fish_crits"],
    "Wound Mods": ["wound_plus_1", "reroll_wounds_1", "reroll_wounds_all", "lethal"],
    "Save/Ap": ["extra_ap_1"],
    "Damage Mods": ["devastating", "melta_range"]
};

const target_SIMULATION_SCENARIOS = {
    "Hit Mods": ["hit_minus_1", "cover"],
    "Wound Mods": ["wound_minus_1", "SgT_wound_minus_1"],
    "Save/Ap": ["plus_1_save"],
    "Damage Mods": ["damage_minus_1", "damage_half", "FNP"]
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
    if (modKey === "fish_crits") weapon.modifiers.fishForCrits = true;
}

function checkSkipReason(weaponsArray, targetUnit, modKey) {
    for (const w of weaponsArray) {
        if (modKey === "hit_plus_1" && w.modifiers.hitMod > 0) return "applied";
        if (modKey === "reroll_hits_1" && (w.modifiers.rerollHits === "ones" || w.modifiers.rerollHits === "all")) return "applied";
        if (modKey === "reroll_hits_all" && w.modifiers.rerollHits === "all") return "applied";
        if (modKey === "sustained_hits" && w.modifiers.sustained > 0) return "applied";
        if (modKey === "wound_plus_1" && w.modifiers.woundMod > 0) return "applied";
        if (modKey === "reroll_wounds_1" && (w.modifiers.rerollWounds === "ones" || w.modifiers.rerollWounds === "all")) return "applied";
        if (modKey === "reroll_wounds_all" && w.modifiers.rerollWounds === "all") return "applied";
        if (modKey === "lethal" && w.modifiers.lethal === true) return "applied";
        if (modKey === "devastating" && w.modifiers.devastating === true) return "applied";
        if (modKey === "fish_crits" && w.modifiers.fishForCrits === true) return "applied";

        if (modKey === "melta_range" && w.modifiers.melta === 0) return "not_applicable";

        let effectiveBs = parseInt(w.BsWs) - w.modifiers.hitMod;
        if (modKey === "hit_plus_1" && effectiveBs <= 2) return "ineffective";
        if (modKey === "reroll_hits_all" && effectiveBs <= 2) return "ineffective";

        let baseWoundTarget = 5;
        if (w.strength >= targetUnit.toughness * 2) baseWoundTarget = 2;
        else if (w.strength > targetUnit.toughness) baseWoundTarget = 3;
        else if (w.strength === targetUnit.toughness) baseWoundTarget = 4;
        else if (w.strength <= targetUnit.toughness / 2) baseWoundTarget = 6;

        let effectiveWound = baseWoundTarget - w.modifiers.woundMod;
        if (targetUnit.modifiers.minusOneWound) effectiveWound += 1;
        if (targetUnit.modifiers.minusOneWoundHighStr && w.strength > targetUnit.toughness) effectiveWound += 1;
        if (w.modifiers.lance) effectiveWound -= 1;

        if (modKey === "wound_plus_1" && effectiveWound <= 2) return "ineffective";
        if (modKey === "reroll_wounds_all" && effectiveWound <= 2) return "ineffective";
    }
    return false;
}

function applyModifiersToTarget(targetUnit, modKey) {

    if (modKey === "hit_minus_1") targetUnit.modifiers.minusOneHit = true;
    if (modKey === "cover") targetUnit.modifiers.cover = true;
    if (modKey === "wound_minus_1") targetUnit.modifiers.minusOneWound = true;
    if (modKey === "SgT_wound_minus_1") targetUnit.modifiers.minusOneWoundHighStr = true;
    if (modKey === "damage_minus_1") targetUnit.modifiers.minusOneDamage = true;
    if (modKey === "damage_half") targetUnit.modifiers.halfDamage = true;
    if (modKey === "FNP") targetUnit.fnp = 5;
    if (modKey === "plus_1_save") targetUnit.modifiers.plusOneSave = true;

};

function checkSkipReasonTarget(targetUnit, weaponsArray, modKey) {

    if (modKey === "hit_minus_1" && targetUnit.modifiers.minusOneHit) return "applied";
    if (modKey === "cover" && targetUnit.modifiers.cover) return "applied";
    if (modKey === "wound_minus_1" && targetUnit.modifiers.minusOneWound) return "applied";
    if (modKey === "SgT_wound_minus_1" && targetUnit.modifiers.minusOneWoundHighStr) return "applied";
    if (modKey === "damage_minus_1" && targetUnit.modifiers.minusOneDamage) return "applied";
    if (modKey === "damage_half" && targetUnit.modifiers.halfDamage) return "applied";
    if (modKey === "FNP" && targetUnit.fnp > 0) return "applied";
    if (modKey === "SgT_wound_minus_1" && targetUnit.toughness >= weaponsArray[0].strength) return "ineffective";

    let rawDam = weaponsArray[0].damage;
    let parsedDam = parseInt(rawDam, 10);
    let isFlatDamage = !isNaN(parsedDam) && String(parsedDam) === String(rawDam).trim();

    if (isFlatDamage) {
        if (modKey === "damage_minus_1" && parsedDam <= 1) return "ineffective";
        if (modKey === "damage_half" && parsedDam <= 1) return "ineffective";

        //check for when damage_half and -1 damage result in the same - we keep the damage -1 rather
        let halfDmg = Math.ceil(parsedDam / 2);
        let minusOneDmg = Math.max(1, parsedDam - 1);

        if (modKey === "damage_half" && halfDmg === minusOneDmg) return "ineffective";
    }

    if (modKey === "plus_1_save" && targetUnit.modifiers.plusOneSave) return "applied";
    if (modKey === "plus_1_save" && weaponsArray[0].Ap >= 0 && targetUnit.save <= 3) return "ineffective";

    return false;
}

if (CalcBtn) {
    CalcBtn.addEventListener("click", () => {

        document.dispatchEvent(new CustomEvent("App:AutoSave"));

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
            currentIsSingleTarget = targetUnit.modelCount === 1;

            const killLabel = currentIsSingleTarget ? "Probability to Kill" : "Expected Models Killed";
            const killValue = currentIsSingleTarget ? (results.averages.killed * 100).toFixed(1) + "%" : results.averages.killed.toFixed(2);

            document.getElementById("results-wrapper").style.display = "grid";
            document.getElementById("stats-html").innerHTML = `
            <div class="stat-card">
                <h5>Average Damage Dealt</h5>
                <div class="stat-value">${results.averages.damage.toFixed(2)}</div>
                <div class="stat-sub">Highest Spike: ${results.extremes.highestDamage}</div>
            </div>
            <div class="stat-card">
                <h5>${killLabel}</h5>
                <div class="stat-value">${killValue}</div>
                <div class="stat-sub">Max Killed: ${results.extremes.highestKills}</div>
            </div>
            <div class="stat-card" style="border-left-color: var(--theme-btn-standard);">
                <h5>Wasted Damage (Overkill)</h5>
                <div class="stat-value" style="color: var(--theme-btn-standard);">${results.averages.wasted.toFixed(2)}</div>
                <div class="stat-sub">Damage Efficiency: ${results.averages.efficiency}%</div>
            </div>
        `;

            renderChart(results.damageDistribution, results.killedDistribution, results.SimulatedRuns, currentIsSingleTarget);

            CalcBtn.textContent = getCurrentTheme().btnStandardText;
            CalcBtn.disabled = false;
            worker.terminate();
        });

        worker.postMessage({
            iterations: SIMULATION_ITERATIONS,
            weaponsArray: attackerWeapons,
            targetUnit: targetUnit
        });
    });
}

if (advAnalyticsBtn) {
    advAnalyticsBtn.addEventListener("click", async () => {
        document.dispatchEvent(new CustomEvent("App:AutoSave"));

        advAnalyticsBtn.textContent = "Running Pipeline...";
        advAnalyticsBtn.disabled = true;
        clearDataBase();

        document.getElementById("advanced-analytics-wrapper").style.display = "block";
        document.getElementById("advanced-reports-container").innerHTML = "";

        const baseWeapons = createWeaponsArray();
        const targetUnit = createUnit();
        const isSingleTarget = targetUnit.modelCount === 1;

        let leaderboardStats = [];

        try {
            let isFirstUnit = true;

            for (const baseWeapon of baseWeapons) {
                const unitName = baseWeapon.unitName;

                const mainContainer = document.getElementById("advanced-reports-container");

                if (!isFirstUnit) {
                    const divider = document.createElement("hr");
                    divider.style.border = "none";
                    divider.style.borderTop = "4px solid var(--theme-divider)";
                    divider.style.margin = "40px auto";
                    divider.style.width = "20%";
                    divider.style.borderRadius = "2px";
                    mainContainer.appendChild(divider);
                }

                const unitAccordion = document.createElement("details");
                unitAccordion.dataset.unit = unitName;


                unitAccordion.style.marginBottom = "20px";
                unitAccordion.style.border = "1px solid var(--border-color)";
                unitAccordion.style.borderRadius = "8px";
                unitAccordion.style.overflow = "hidden";
                unitAccordion.style.background = "var(--bg-color)";

                unitAccordion.innerHTML = `
                    <summary style="background: var(--surface-hover); padding: 15px; cursor: pointer; font-weight: bold; font-size: 1.1rem; outline: none;">
                        ${unitName} - Advanced Analytics
                    </summary>
                    <div class="unit-reports-wrapper" style="padding: 15px;"></div>
                `;
                mainContainer.appendChild(unitAccordion);

                if (isFirstUnit) unitAccordion.open = true;
                isFirstUnit = false;

                ModLabels["Base"] = `Base Profile (AP ${baseWeapon.Ap})`;
                ModLabels["extra_ap_1"] = `AP ${baseWeapon.Ap - 1}`;

                let statsHTML = buildBaseStatsHTML([baseWeapon], targetUnit);

                let allowedHitMods = ["Base"];
                let allowedWoundMods = ["Base"];
                let allowedSaveMods = ["Base"];
                let allowedDamageMods = ["Base"];
                let allowedKilledMods = ["Base"];
                let skippedMods = {};

                let singleWeaponRoster = [baseWeapon];
                const originalMelta = baseWeapon.modifiers.melta;
                baseWeapon.modifiers.melta = 0;

                let baseResults = await runWorkerSimulation(SIMULATION_ITERATIONS, singleWeaponRoster, targetUnit);

                leaderboardStats.push({
                    unitName: unitName,
                    avgDamage: baseResults.averages.damage,
                    avgKills: baseResults.averages.killed
                });

                loadDataIntoSQL(unitName, "Base", "Hit", baseResults.hitDistribution);
                loadDataIntoSQL(unitName, "Base", "Wound", baseResults.woundDistribution);
                loadDataIntoSQL(unitName, "Base", "Save", baseResults.saveDistribution);
                loadDataIntoSQL(unitName, "Base", "Damage", baseResults.damageDistribution);
                loadDataIntoSQL(unitName, "Base", "ModelsKilled", baseResults.killedDistribution);
                loadAveragesIntoSQL(unitName, "Base", baseResults.averages);

                baseWeapon.modifiers.melta = originalMelta;

                //attacker sim loop
                for (const [category, mods] of Object.entries(SIMULATION_SCENARIOS)) {
                    for (const modKey of mods) {

                        const skipReason = checkSkipReason([baseWeapon], targetUnit, modKey);

                        if (skipReason === "not_applicable") continue;

                        if (category === "Hit Mods") allowedHitMods.push(modKey);
                        if (category === "Wound Mods") allowedWoundMods.push(modKey);
                        if (category === "Save/Ap") allowedSaveMods.push(modKey);
                        if (category === "Damage Mods") {
                            allowedDamageMods.push(modKey);
                            allowedKilledMods.push(modKey);
                        }

                        if (skipReason) {
                            skippedMods[modKey] = skipReason;
                            continue;
                        }

                        let moddedWeapon = JSON.parse(JSON.stringify(baseWeapon));
                        applyModifierToWeapon(moddedWeapon, modKey);

                        let results = await runWorkerSimulation(SIMULATION_ITERATIONS, [moddedWeapon], targetUnit);

                        loadDataIntoSQL(unitName, modKey, "Hit", results.hitDistribution);
                        loadDataIntoSQL(unitName, modKey, "Wound", results.woundDistribution);
                        loadDataIntoSQL(unitName, modKey, "Save", results.saveDistribution);
                        loadDataIntoSQL(unitName, modKey, "Damage", results.damageDistribution);
                        loadDataIntoSQL(unitName, modKey, "ModelsKilled", results.killedDistribution);
                        loadAveragesIntoSQL(unitName, modKey, results.averages);
                    }
                }


                //target unit sim loop
                for (const [category, mods] of Object.entries(target_SIMULATION_SCENARIOS)) {
                    for (const modKey of mods) {

                        const skipReason = checkSkipReasonTarget(targetUnit, [baseWeapon], modKey);

                        if (skipReason === "not_applicable") continue;

                        //these arrays are now shared by attacking and target unit
                        if (category === "Save/Ap") allowedSaveMods.push(modKey);
                        if (category === "Damage Mods") {
                            allowedDamageMods.push(modKey);
                            allowedKilledMods.push(modKey);
                        }

                        if (skipReason) {
                            //skipped mods is also shared
                            skippedMods[modKey] = skipReason;
                            continue;
                        }

                        let moddedTarget = JSON.parse(JSON.stringify(targetUnit));

                        applyModifiersToTarget(moddedTarget, modKey);

                        let results = await runWorkerSimulation(SIMULATION_ITERATIONS, [baseWeapon], moddedTarget);

                        loadDataIntoSQL(unitName, modKey, "Hit", results.hitDistribution);
                        loadDataIntoSQL(unitName, modKey, "Wound", results.woundDistribution);
                        loadDataIntoSQL(unitName, modKey, "Save", results.saveDistribution);
                        loadDataIntoSQL(unitName, modKey, "Damage", results.damageDistribution);
                        loadDataIntoSQL(unitName, modKey, "ModelsKilled", results.killedDistribution);
                        loadAveragesIntoSQL(unitName, modKey, results.averages);

                    }
                }

                const sqlData = queryComparisonData(unitName);
                const sqlAvgData = queryAveragesData(unitName);
                const attackerUnitReport = unitAccordion.querySelector('.unit-reports-wrapper');


                // create each report section
                generateAdvancedReport(`${unitName}: Hit Averages`, "Hit", sqlData, sqlAvgData, SIMULATION_ITERATIONS, allowedHitMods, skippedMods, statsHTML, attackerUnitReport, isSingleTarget);
                generateAdvancedReport(`${unitName}: Wound Averages <button class="tutorial-btn" data-tutorial="wound_avg">?</button>`, "Wound", sqlData, sqlAvgData, SIMULATION_ITERATIONS, allowedWoundMods, skippedMods, statsHTML, attackerUnitReport, isSingleTarget);
                generateAdvancedReport(`${unitName}: Save Averages`, "Save", sqlData, sqlAvgData, SIMULATION_ITERATIONS, allowedSaveMods, skippedMods, statsHTML, attackerUnitReport, isSingleTarget);
                generateAdvancedReport(`${unitName}: Damage Averages <button class="tutorial-btn" data-tutorial="damage_avg">?</button>`, "Damage", sqlData, sqlAvgData, SIMULATION_ITERATIONS, allowedDamageMods, skippedMods, statsHTML, attackerUnitReport, isSingleTarget);
                generateAdvancedReport(`${unitName}: Models Killed Averages <button class="tutorial-btn" data-tutorial="damage_avg">?</button>`, "ModelsKilled", sqlData, sqlAvgData, SIMULATION_ITERATIONS, allowedKilledMods, skippedMods, statsHTML, attackerUnitReport, isSingleTarget);
                const sidebars = attackerUnitReport.querySelectorAll('.avg-stats-sidebar');
                let maxHeight = 0;
                sidebars.forEach(sidebar => {
                    if (sidebar.offsetHeight > maxHeight) maxHeight = sidebar.offsetHeight;
                });
                sidebars.forEach(sidebar => {
                    sidebar.style.minHeight = maxHeight + 'px';
                });
            }

            //leaderboard to ui-manager
            const mainContainer = document.getElementById("advanced-reports-container");
            spawnLeaderboard(mainContainer, leaderboardStats, isSingleTarget);
        } catch (error) {
            console.error("Pipeline Failed:", error);
            alert("Pipeline Failed.");
        }

        advAnalyticsBtn.textContent = getCurrentTheme().btnAdvancedText;
        advAnalyticsBtn.disabled = false;
    });
}
function generateAdvancedReport(title, category, sqlData, sqlAvgData, totalRuns, allowedMods, skippedMods, statsHTML, targetContainer, isSingleTarget = false) {

    const baseRow = sqlAvgData.find(r => r.modifier_name === "Base");
    const processedRows = allowedMods.map(modName => {
        let skipReason = skippedMods[modName] || null;
        let dataRow = skipReason ? baseRow : sqlAvgData.find(r => r.modifier_name === modName);

        return {
            ...dataRow,
            modifier_name: modName,
            skipReason: skipReason
        };
    }).filter(r => r.unit_name);

    const th = `padding: 8px 10px; color: var(--theme-text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color);`;
    const td = `padding: 10px; background: rgba(255,255,255,0.03); color: #fff; font-weight: bold; margin-bottom: 5px;`;
    const tdFirst = td + `border-left: 3px solid var(--theme-text-light); border-radius: 4px 0 0 4px;`;
    const tdLast = td + `border-radius: 0 4px 4px 0;`;

    let avgStatsHTML = `<table style="width: 100%; border-collapse: separate; border-spacing: 0 6px; font-size: 0.9rem; text-align: left;">`;

    const getRowNameHTML = (row) => {
        let name = ModLabels[row.modifier_name] || row.modifier_name;
        if (row.modifier_name === "Base") name = "Base Profile";

        if (row.skipReason === "applied") {
            return `${name} <span style="margin-left: 8px; padding: 2px 6px; background: rgba(255,255,255,0.1); color: var(--theme-text-light); border-radius: 4px; font-size: 0.65rem; text-transform: uppercase;">Active</span>`;
        } else if (row.skipReason === "ineffective") {
            return `${name} <span style="margin-left: 8px; padding: 2px 6px; background: var(--border-color); color: var(--theme-text-muted); border-radius: 4px; font-size: 0.65rem; text-transform: uppercase;">Redundant</span>`;
        }
        return name;
    };

    if (category === "Hit") {
        const hasBonus = processedRows.some(r => r.hits_bonus > 0);
        const hasAuto = processedRows.some(r => r.hits_auto > 0);

        let headers = `<th style="${th}">Rule</th><th style="${th}">Avg Total Hits</th>`;
        if (hasBonus) headers += `<th style="${th}">Inc. Sustained</th>`;
        if (hasAuto) headers += `<th style="${th}">Inc. Lethal</th>`;
        avgStatsHTML += `<tr>${headers}</tr>`;

        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;

            // summing all buckets for the true total
            let totalHits = row.hits_success + row.hits_bonus + row.hits_auto;
            let cells = [totalHits.toFixed(2)];

            if (hasBonus) cells.push(row.hits_bonus > 0 ? row.hits_bonus.toFixed(2) : '-');
            if (hasAuto) cells.push(row.hits_auto > 0 ? row.hits_auto.toFixed(2) : '-');

            let rowHTML = `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td>`;
            cells.forEach((val, index) => {
                rowHTML += `<td style="${index === cells.length - 1 ? tdLast : td}">${val}</td>`;
            });
            avgStatsHTML += rowHTML + `</tr>`;
        });
    }
    else if (category === "Wound") {
        const hasDev = processedRows.some(r => r.wounds_dev > 0);
        const hasAuto = processedRows.some(r => r.hits_auto > 0); // Lethals act as auto-wounds

        let headers = `<th style="${th}">Rule</th><th style="${th}">Avg Total Wounds</th>`;
        if (hasDev) headers += `<th style="${th}">Inc. Devastating</th>`;
        if (hasAuto) headers += `<th style="${th}">Inc. Lethal</th>`;
        avgStatsHTML += `<tr>${headers}</tr>`;

        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;

            // summing normal wounds, devastating wounds and auto-wounding lethals
            let totalWounds = row.wounds_success + row.wounds_dev + row.hits_auto;
            let cells = [totalWounds.toFixed(2)];

            if (hasDev) cells.push(row.wounds_dev > 0 ? row.wounds_dev.toFixed(2) : '-');
            if (hasAuto) cells.push(row.hits_auto > 0 ? row.hits_auto.toFixed(2) : '-');

            let rowHTML = `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td>`;
            cells.forEach((val, index) => {
                rowHTML += `<td style="${index === cells.length - 1 ? tdLast : td}">${val}</td>`;
            });
            avgStatsHTML += rowHTML + `</tr>`;
        });
    }
    else if (category === "Save") {
        avgStatsHTML += `<tr><th style="${th}">Rule</th><th style="${th}">Saves Forced</th><th style="${th}">Passed</th><th style="${th}">Failed (Dmg)</th></tr>`;
        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;
            avgStatsHTML += `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td><td style="${td}">${row.saves_forced.toFixed(2)}</td><td style="${td}">${row.saves_passed.toFixed(2)}</td><td style="${tdLast}">${row.saves_failed.toFixed(2)}</td></tr>`;
        });
    }
    else if (category === "Damage") {
        avgStatsHTML += `<tr><th style="${th}">Rule</th><th style="${th}">Avg Total Damage</th></tr>`;
        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;
            avgStatsHTML += `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td><td style="${tdLast}">${row.avg_damage.toFixed(2)}</td></tr>`;
        });
    }
    else if (category === "ModelsKilled") {
        const killHeader = isSingleTarget ? "Probability to Kill" : "Expected Models Killed";
        avgStatsHTML += `<tr><th style="${th}">Rule</th><th style="${th}">${killHeader}</th><th style="${th}">Overkill</th><th style="${th}">Efficiency</th></tr>`;
        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;
            const killValue = isSingleTarget ? (row.avg_killed * 100).toFixed(1) + "%" : row.avg_killed.toFixed(3);
            avgStatsHTML += `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td><td style="${td}">${killValue}</td><td style="${td}">${row.avg_wasted.toFixed(2)}</td><td style="${tdLast}">${row.efficiency}%</td></tr>`;
        });
    }
    avgStatsHTML += `</table>`;

    const card = spawnReportCard(title, targetContainer, statsHTML, avgStatsHTML);
    const chartMods = allowedMods.filter(m => !skippedMods[m]);
    renderAdvancedChart(card.querySelector('.adv-chart'), category, sqlData, totalRuns, chartMods, isSingleTarget);
}

function buildBaseStatsHTML(weaponsArray, targetUnit) {
    let html = `<div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%;">`;

    weaponsArray.forEach(w => {
        let activeMods = [];
        if (w.modifiers.lethal) activeMods.push("Lethal");
        if (w.modifiers.devastating) activeMods.push("Dev Wounds");
        if (w.modifiers.sustained > 0) activeMods.push(`Sus ${w.modifiers.sustained}`);
        if (w.modifiers.rerollHits !== "none") activeMods.push(`RR Hits`);
        if (w.modifiers.rerollWounds !== "none") activeMods.push(`RR Wounds`);
        if (w.modifiers.anti > 0) activeMods.push(`Anti-${w.modifiers.anti}+`);
        if (w.modifiers.lance) activeMods.push("Lance");
        if (w.modifiers.rapidFire > 0) activeMods.push(`RF ${w.modifiers.rapidFire}`);
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
        <div style="flex: 1; min-width: 200px; background: rgba(0,0,0,0.2); padding: 6px 12px; border-radius: 4px; border-left: 3px solid var(--theme-accent); display: flex; flex-direction: column; justify-content: center;">
            <div style="color: var(--theme-text-muted); font-size: 0.65rem; font-weight: bold; text-transform: uppercase;">Attacker: ${w.unitName}</div>
            <div style="font-size: 0.85rem; color: #fff; font-weight: bold; margin: 2px 0;">
                ${w.unitCount * w.modelCount}M  |  ${w.attack}A  |  BS/WS ${w.BsWs}+  |  S${w.strength}  |  AP${w.Ap}  |  D ${w.damage}
            </div>
            <div style="color: var(--theme-accent); font-size: 0.7rem; font-weight: bold;">${modsStr}</div>
        </div>`;
    });

    let targetMods = [];
    if (targetUnit.modifiers.minusOneHit) targetMods.push("-1 Hit");
    if (targetUnit.modifiers.minusOneWound) targetMods.push("-1 Wnd");
    if (targetUnit.modifiers.minusOneWoundHighStr) targetMods.push("S>T -1 Wnd");
    if (targetUnit.modifiers.cover) targetMods.push("Cover");
    if (targetUnit.modifiers.halfDamage) targetMods.push("1/2 Dmg");
    if (targetUnit.modifiers.minusOneDamage) targetMods.push("-1 Dmg");
    if (targetUnit.modifiers.plusOneSave) targetMods.push("+1 Save");
    if (targetUnit.fnp && targetUnit.fnp > 1) targetMods.push(`FNP ${targetUnit.fnp}+`);
    let targetModsStr = targetMods.length > 0 ? targetMods.join(' | ') : "[No Mods]";

    html += `
    <div style="flex: 1; min-width: 180px; background: rgba(0,0,0,0.2); padding: 6px 12px; border-radius: 4px; border-left: 3px solid var(--theme-btn-standard); display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--theme-text-muted); font-size: 0.65rem; font-weight: bold; text-transform: uppercase;">Target Profile</div>
        <div style="font-size: 0.85rem; color: #fff; font-weight: bold; margin: 2px 0;">
            T${targetUnit.toughness}  |  W${targetUnit.wounds}  |  SV ${targetUnit.save}+ ${targetUnit.inVul ? ' |  ' + targetUnit.inVul + '++' : ''}
        </div>
        <div style="color: var(--theme-btn-standard); font-size: 0.7rem; font-weight: bold;">${targetModsStr}</div>
    </div>`;

    html += `</div>`;
    return html;
}

function loadTargetProfile(targetData) {
    if (!targetData) return;
    document.getElementById("toughness").value = targetData.toughness;
    document.getElementById("wounds").value = targetData.wounds;
    document.getElementById("save").value = targetData.save;
    document.getElementById("inVul").value = targetData.inVul || "";
    document.getElementById("target-models").value = targetData.modelCount;
    document.getElementById("def-fnp").value = targetData.fnp || "0";

    const mods = targetData.modifiers;
    if (mods) {
        document.getElementById("def-minus-hit").checked = mods.minusOneHit;
        document.getElementById("def-minus-wound").checked = mods.minusOneWound;
        document.getElementById("def-minus-wound-str").checked = mods.minusOneWoundHighStr;
        document.getElementById("def-cover").checked = mods.cover;
        document.getElementById("def-plus-one-save").checked = mods.plusOneSave;

        if (mods.halfDamage) {
            document.getElementById("def-reduce-dam").value = "half";
        } else if (mods.minusOneDamage) {
            document.getElementById("def-reduce-dam").value = "minus1";
        } else {
            document.getElementById("def-reduce-dam").value = "none";
        }
    }
}

function exportRoster() {
    const weaponsArray = createWeaponsArray();
    let fileName = RosterNameInput.value.trim();
    if (!fileName.endsWith(".json")) fileName += ".json";

    const blob = new Blob([JSON.stringify(weaponsArray, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawText = e.target.result;
            const jsonData = JSON.parse(rawText);

            if (Array.isArray(jsonData)) {
                buildRosterFromJSON(RosterContainer, jsonData, false);
            } else {
                buildRosterFromJSON(RosterContainer, jsonData.roster, false);

                if (jsonData.target) {
                    loadTargetProfile(jsonData.target);
                }

                if (jsonData.globalRule) {
                    const globalDrop = document.getElementById("global-mod-dropdown");
                    if (globalDrop) globalDrop.value = jsonData.globalRule;
                }
            }
            syncAppUI();


            setTimeout(() => {
                document.dispatchEvent(new CustomEvent("App:AutoSave"));
            }, 100);

        } catch (error) {
            alert("Invalid JSON file! Could not parse roster.");
            console.error(error);
        }
    };
    reader.readAsText(file);
}

if (localStorage.getItem("40kRoster")) {
    console.log("Found save data. Attempting to load...");
    const loadSavedRoster = localStorage.getItem("40kRoster");
    try {
        const jsonData = JSON.parse(loadSavedRoster);
        console.log("Parsed JSON:", jsonData);

        if (Array.isArray(jsonData)) {
            buildRosterFromJSON(RosterContainer, jsonData);
        } else {
            buildRosterFromJSON(RosterContainer, jsonData.roster);
            if (jsonData.target) loadTargetProfile(jsonData.target);
            if (jsonData.globalRule) {
                const globalDrop = document.getElementById("global-mod-dropdown");
                if (globalDrop) globalDrop.value = jsonData.globalRule;
            }
        }
        if (ImportInput) ImportInput.value = "";
    } catch (error) {
        console.error("Save Data Crashed. Error details:", error);

    }
} else {
    addAttackerModule(RosterContainer);
}

//autosave
function autoSave() {
    try {
        const globalDrop = document.getElementById("global-mod-dropdown");
        const rosterState = {
            roster: createWeaponsArray(),
            target: createUnit(),
            globalRule: globalDrop ? globalDrop.value : "none"
        };
        localStorage.setItem("40kRoster", JSON.stringify(rosterState, null, 2));
        console.log("Auto-saved successfully!");
    } catch (error) {
        console.error("Failed to auto-save:", error);
    }
}


// function to wipe the board completely
function clearDashboard() {
    localStorage.removeItem("40kRoster");

    RosterContainer.innerHTML = '';
    addAttackerModule(RosterContainer);

    // reset Target Profile Stats
    document.getElementById("toughness").value = 4;
    document.getElementById("wounds").value = 2;
    document.getElementById("save").value = 3;
    document.getElementById("inVul").value = "";
    document.getElementById("target-models").value = 5;
    document.getElementById("def-fnp").value = "0";

    ["def-minus-hit", "def-minus-wound", "def-minus-wound-str", "def-cover"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    const reduceDam = document.getElementById("def-reduce-dam");
    if (reduceDam) reduceDam.value = "none";

    const globalDrop = document.getElementById("global-mod-dropdown");
    if (globalDrop) globalDrop.value = "none";

    const stdResults = document.getElementById("results-wrapper");
    if (stdResults) stdResults.style.display = "none";

    const advResults = document.getElementById("advanced-analytics-wrapper");
    if (advResults) advResults.style.display = "none";

    syncAppUI();
}

// Listen for the custom event from the Theme Changer
document.addEventListener("App:ClearDashboard", clearDashboard);

// manual Clear Dashboard Button
if (ClearBtn) {
    ClearBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all units and reset the dashboard?")) {
            clearDashboard();
        }
    });
}