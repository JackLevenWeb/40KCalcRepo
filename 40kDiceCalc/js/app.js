//#region imports >>>>>>>>>>>>>>>>>>>>>>>

import { Unit } from './classes/Unit.js';
import { Weapon } from './classes/Weapon.js';
import { runSimulation } from './logic.js';
import { addAttackerModule, syncAppUI, buildRosterFromJSON, spawnReportCard, addBadgeToModule, spawnLeaderboard, renderCombiMirror, renderCombinatorialLeaderboard, initCombinatorialPool, switchDashboardView } from './ui-manager.js';
import { initDataBase, loadDataIntoSQL, queryComparisonData, clearDataBase, ModLabels, loadAveragesIntoSQL, queryAveragesData } from './db-manager.js';
import { renderChart, renderAdvancedChart } from './chart-manager.js';
import { initializeWatchers, setupDragAndDrop } from './event-manager.js';
import { applyTheme, getCurrentTheme } from './theme-manager.js';
import { scrapeCombinatorialSelections, generateCombinations } from './combinatorial-engine.js';
import './fetchUnitStats.js'
import { initializeTelemetry, startTelemetryTimer, dispatchTelemetryEvent, generateId } from './telemetry-manager.js';
import { initializeAuth } from './auth-manager.js';
import { ModifierRegistry } from './modifier-registry.js';
//#endregion

//#region initialization and state >>>>>>>>>>>>>>>>>>>>>>>

// Global Authentication State consumed by telemetry-manager.js
export const AuthState = {
    userId: "guest_user",
    userName: "Guest",
    authToken: null,
    appVersion: "1.0.0"
};

// initializeWatchers from auth-manager.js
initializeAuth(AuthState);

const SIMULATION_ITERATIONS = 250000;

// initializeWatchers from event-manager.js
initializeWatchers();

const savedTheme = localStorage.getItem("40kTheme") || "space_wolves";

// applyTheme from theme-manager.js
applyTheme(savedTheme);

document.addEventListener("App:AutoSave", autoSave);
document.addEventListener("App:ExportRoster", exportRoster);
document.addEventListener("App:ImportRoster", (e) => handleImport(e.detail.file));

document.addEventListener("App:ThemeChanged", () => {
    const stdResults = document.getElementById("results-wrapper");

    if (stdResults && stdResults.style.display !== "none" && currentSimulationResults) {
        // renderChart from chart-manager.js
        renderChart(currentSimulationResults.damageDistribution, currentSimulationResults.killedDistribution, currentSimulationResults.SimulatedRuns, currentIsSingleTarget);
    }
});

document.addEventListener("App:DuplicateModule", (e) => {
    const targetId = e.detail.unitId;
    const allWeapons = createWeaponsArray();
    const weaponToClone = allWeapons.find(w => w.unitId === targetId);

    if (weaponToClone) {
        const clone = structuredClone(weaponToClone);
        clone.unitName = clone.unitName + " (Copy)";
        clone.unitId = crypto.randomUUID();

        buildRosterFromJSON(RosterContainer, [clone], false);
        document.dispatchEvent(new CustomEvent("App:AutoSave"));
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

let activeCombiWeapons = [];
let activeCombiTarget = null;

// initDataBase from db-manager.js
initDataBase();

// initCombinatorialPool from ui-manager.js
initCombinatorialPool();

// setupDragAndDrop from event-manager.js
setupDragAndDrop();

// activates telemetry listener from telemetry-manager.js
initializeTelemetry();

//#endregion

//#region core data builders >>>>>>>>>>>>>>>>>>>>>>>

// link target UI checkboxes to their state keys
const TARGET_CHECKBOXES = {
    "def-minus-hit": "minusOneHit",
    "def-minus-wound": "minusOneWound",
    "def-minus-wound-str": "minusOneWoundHighStr",
    "def-cover": "cover",
    "def-plus-one-save": "plusOneSave"
};

// parse ui modules into weapon data
function createWeaponsArray(stripBadges = false) {
    const modules = document.querySelectorAll('.attacker-module');
    const weaponsArray = [];

    modules.forEach(module => {

        const unitId = module.getAttribute('data-unit-id');

        const rawUnitName = module.querySelector(".in-unit-name").value.trim();
        const unitName = rawUnitName.replace(/'/g, "`");

        const faction = module.querySelector(".in-faction") ? module.querySelector(".in-faction").value : "Unknown";
        const attack = module.querySelector(".in-attacks").value.trim().toUpperCase() || "1";
        const damage = module.querySelector(".in-dam").value.trim().toUpperCase() || "1";
        const bsws = module.querySelector(".in-bsws").value.trim().toUpperCase();
        const strength = parseInt(module.querySelector(".in-str").value, 10);
        const ap = parseInt(module.querySelector(".in-ap").value, 10);
        const modelCount = parseInt(module.querySelector(".in-models").value, 10);
        const unitCount = parseInt(module.querySelector(".in-units").value, 10);

        const isLeader = module.querySelector('.is-leader').checked;

        // --- extract the target id instead of the string name ---
        const attachTargetId = module.querySelector('.attach-to').value || null;

        const grantedKeyword = stripBadges ? "none" : module.querySelector('.grant-keyword').value;

        const badgesToStrip = [
            "lethal", "devastating", "sustained", "hit_plus_1", "hit_minus_1", "wound_plus_1", "wound_minus_1",
            "reroll_hits_1", "reroll_hits_all", "reroll_wounds_1", "reroll_wounds_all",
            "fish_crits", "reroll_damage", "reroll_one_hit", "reroll_one_wound", "reroll_one_damage",
            "lance", "twinlinked", "damage_plus_1"
        ];

        const hasMod = (key) => {
            if (stripBadges && badgesToStrip.includes(key)) return false;

            return module.querySelector(`.mod-badge[data-key="${key}"]`) !== null;
        };

        const getModVal = (key) => {
            if (stripBadges && badgesToStrip.includes(key)) return 0;

            const badge = module.querySelector(`.mod-badge[data-key="${key}"]`);

            return badge ? parseInt(badge.querySelector(".badge-val").value, 10) : 0;
        };

        let hitModTotal = 0;
        if (hasMod("hit_plus_1")) hitModTotal += 1;
        if (hasMod("hit_minus_1")) hitModTotal -= 1;

        let woundModTotal = 0;
        if (hasMod("wound_plus_1")) woundModTotal += 1;
        if (hasMod("wound_minus_1")) woundModTotal -= 1;

        let damageModTotal = 0;
        if (hasMod("damage_plus_1")) damageModTotal += 1;

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
            damageMod: damageModTotal,
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
            fishForCrits: hasMod("fish_crits"),
            rerollDamage: hasMod("reroll_damage"),
            rerollOneHit: hasMod("reroll_one_hit"),
            rerollOneWound: hasMod("reroll_one_wound"),
            rerollOneDamage: hasMod("reroll_one_damage")
        };

        // Weapon from Weapon.js

        const newWeapon = new Weapon(unitName, attack, bsws, strength, ap, damage, modelCount, unitCount, modifiers);

        newWeapon.unitId = unitId;
        newWeapon.faction = faction;
        newWeapon.isLeader = isLeader;
        newWeapon.attachTargetId = attachTargetId;
        newWeapon.grantedKeyword = grantedKeyword;
        newWeapon.includeInCombi = module.querySelector('.in-combi-roster') ? module.querySelector('.in-combi-roster').checked : false;

        weaponsArray.push(newWeapon);
    });

    return weaponsArray;
}

// parse ui into target unit data
function createUnit() {
    const nameInput = document.getElementById("target-name");
    const targetName = nameInput ? nameInput.value.trim() : "Target Unit";

    //grab the faction
    const factionDrop = document.getElementById("target-faction");
    const targetFaction = factionDrop ? factionDrop.value : "Unknown";

    const toughness = parseInt(document.getElementById("toughness").value, 10);
    const wounds = parseInt(document.getElementById("wounds").value, 10);
    const save = parseInt(document.getElementById("save").value, 10);
    const inVul = parseInt(document.getElementById("inVul").value, 10) || null;
    const fnp = parseInt(document.getElementById("def-fnp").value, 10) || null;
    const modelCount = parseInt(document.getElementById("target-models").value, 10);

    const reductionDrop = document.getElementById("def-reduce-dam") ? document.getElementById("def-reduce-dam").value : "none";

    const modifiers = {
        halfDamage: reductionDrop === "half",
        minusOneDamage: reductionDrop === "minus1"
    };

    // scrape all target checkboxes
    for (const [id, stateKey] of Object.entries(TARGET_CHECKBOXES)) {
        const el = document.getElementById(id);
        modifiers[stateKey] = el ? el.checked : false;
    }

    // Unit from Unit.js
    const unit = new Unit(toughness, wounds, save, inVul, fnp, modelCount, modifiers);
    unit.name = targetName;
    unit.faction = targetFaction;

    return unit;
}

// maps saved target data back into the ui
function loadTargetProfile(targetData) {
    if (!targetData) return;

    const nameInput = document.getElementById("target-name");
    if (nameInput && targetData.name) nameInput.value = targetData.name;
    const factionDrop = document.getElementById("target-faction");
    if (factionDrop && targetData.faction) factionDrop.value = targetData.faction;

    document.getElementById("toughness").value = targetData.toughness || 4;
    document.getElementById("wounds").value = targetData.wounds || 2;
    document.getElementById("save").value = targetData.save || 3;
    document.getElementById("inVul").value = targetData.inVul || "";
    document.getElementById("target-models").value = targetData.modelCount || 5;
    document.getElementById("def-fnp").value = targetData.fnp || "0";

    if (targetData.modifiers) {
        // restore target checkboxes
        for (const [id, stateKey] of Object.entries(TARGET_CHECKBOXES)) {
            const el = document.getElementById(id);
            if (el) el.checked = targetData.modifiers[stateKey] || false;
        }

        const reduceDam = document.getElementById("def-reduce-dam");
        if (reduceDam) {
            if (targetData.modifiers.halfDamage) reduceDam.value = "half";
            else if (targetData.modifiers.minusOneDamage) reduceDam.value = "minus1";
            else reduceDam.value = "none";
        }
    }
}

//#endregion

//#region simulation worker and scenarios >>>>>>>>>>>>>>>>>>>>>>>


// toggles all sim buttons to prevent overlapping worker threads
function setSimulationButtonsState(isDisabled) {
    const calcBtn = document.getElementById("calculate-btn");
    const advBtn = document.getElementById("advanced-analytics-btn");
    const combiBtn = document.getElementById("run-combinatorial-btn");

    const tabStandard = document.getElementById("tab-standard");
    const tabCombi = document.getElementById("tab-combinatorial");
    const tabDataLoom = document.getElementById("tab-dataloom");

    if (calcBtn) calcBtn.disabled = isDisabled;
    if (advBtn) advBtn.disabled = isDisabled;
    if (combiBtn) combiBtn.disabled = isDisabled;

    if (tabStandard) tabStandard.disabled = isDisabled;
    if (tabCombi) tabCombi.disabled = isDisabled;
    if (tabDataLoom) tabDataLoom.disabled = isDisabled;
}

// execute simulation in background thread
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



// generates testing scenarios based on the ModifierRegistry
function generateSimulationScenarios() {
    const scenarios = {
        "Hit Mods": [],
        "Wound Mods": [],
        "Save/Ap": [],
        "Damage Mods": []
    };

    for (const modKey in ModifierRegistry) {
        // skip debuffs
        if (modKey.includes("minus")) continue;


        if (modKey.includes("hit") || modKey === "sustained" || modKey === "fish_crits") {
            scenarios["Hit Mods"].push(modKey);
        }
        else if (modKey.includes("wound") || modKey === "lethal" || modKey === "lance" || modKey === "anti") {
            scenarios["Wound Mods"].push(modKey);
        }
        else if (modKey.includes("ap")) {
            scenarios["Save/Ap"].push(modKey);
        }
        else if (modKey.includes("damage") || modKey === "devastating" || modKey === "melta") {
            scenarios["Damage Mods"].push(modKey);
        }
    }

    return scenarios;
}

const SIMULATION_SCENARIOS = generateSimulationScenarios();

const target_SIMULATION_SCENARIOS = {
    "Hit Mods": ["hit_minus_1", "cover"],
    "Wound Mods": ["wound_minus_1", "SgT_wound_minus_1"],
    "Save/Ap": ["plus_1_save"],
    "Damage Mods": ["damage_minus_1", "damage_half", "FNP"]
};

//#endregion

//#region modifier logic >>>>>>>>>>>>>>>>>>>>>>>

// directly apply active rule to weapon stats
function applyModifierToWeapon(weapon, modKey, targetUnit) {
    if (ModifierRegistry[modKey] && ModifierRegistry[modKey].applyEffect) {
        ModifierRegistry[modKey].applyEffect(weapon, targetUnit);
    }
}

// prevent redundant or mathematically impossible rules
function checkSkipReason(weaponsArray, targetUnit, modKey) {
    if (ModifierRegistry[modKey] && ModifierRegistry[modKey].checkRedundancy) {
        return ModifierRegistry[modKey].checkRedundancy(weaponsArray, targetUnit);
    }
    return false;
}

// apply defensive buffs
function applyModifiersToTarget(targetUnit, modKey, weaponsArray = []) {
    if (ModifierRegistry[modKey] && ModifierRegistry[modKey].applyEffect) {
        let referenceWeapon = weaponsArray.length > 0 ? weaponsArray[0] : {};
        ModifierRegistry[modKey].applyEffect(referenceWeapon, targetUnit);
    }
}

// prevent redundant target buffs
function checkSkipReasonTarget(targetUnit, weaponsArray, modKey) {
    if (ModifierRegistry[modKey] && ModifierRegistry[modKey].checkRedundancy) {
        return ModifierRegistry[modKey].checkRedundancy(weaponsArray, targetUnit);
    }
    return false;
}

//#endregion

//#region primary event listeners >>>>>>>>>>>>>>>>>>>>>>>

// runs base simulation and renders charts
if (CalcBtn) {
    CalcBtn.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("App:AutoSave"));
        CalcBtn.textContent = "Rolling dice...";
        // disable all buttons when simulation starts
        setSimulationButtonsState(true);

        const attackerWeapons = createWeaponsArray();
        const targetUnit = createUnit();

        const worker = new Worker(new URL('./webWorker.js', import.meta.url), { type: 'module' });

        worker.addEventListener('error', (error) => {
            console.error("PIPELINE CRASH:", error.message);
            CalcBtn.textContent = "Pipeline Error (Check Console)";
            setSimulationButtonsState(false);
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

            // getCurrentTheme from theme-manager.js
            CalcBtn.textContent = getCurrentTheme().btnStandardText;
            setSimulationButtonsState(false);

            const batchId = generateId();

            // dispatches the telemetry event
            dispatchTelemetryEvent(startTime, results, attackerWeapons, targetUnit, AuthState, "base_profile", batchId);

            worker.terminate();
        });

        // start timer
        const startTime = startTelemetryTimer();

        worker.postMessage({ iterations: SIMULATION_ITERATIONS, weaponsArray: attackerWeapons, targetUnit: targetUnit });
    });
}

// loops through allowed scenarios and populates advanced report
if (advAnalyticsBtn) {
    advAnalyticsBtn.addEventListener("click", async () => {
        document.dispatchEvent(new CustomEvent("App:AutoSave"));

        advAnalyticsBtn.textContent = "Running Pipeline...";
        setSimulationButtonsState(true);

        // start timer
        const startTime = startTelemetryTimer();
        const batchId = generateId();

        // clearDataBase from db-manager.js
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

                // loadDataIntoSQL from db-manager.js
                loadDataIntoSQL(unitName, "Base", "Hit", baseResults.hitDistribution);
                loadDataIntoSQL(unitName, "Base", "Wound", baseResults.woundDistribution);
                loadDataIntoSQL(unitName, "Base", "Save", baseResults.saveDistribution);
                loadDataIntoSQL(unitName, "Base", "Damage", baseResults.damageDistribution);
                loadDataIntoSQL(unitName, "Base", "ModelsKilled", baseResults.killedDistribution);

                // loadAveragesIntoSQL from db-manager.js
                loadAveragesIntoSQL(unitName, "Base", baseResults.averages);

                // dispatche analysis telemetry
                dispatchTelemetryEvent(startTime, baseResults, singleWeaponRoster, targetUnit, AuthState, "delta_analysis", batchId);

                baseWeapon.modifiers.melta = originalMelta;

                //attacker mods
                // iterate through every available mod to simulate and measure its isolated impact on the base profile
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

                        let moddedWeapon = structuredClone(baseWeapon);
                        applyModifierToWeapon(moddedWeapon, modKey, targetUnit);

                        let results = await runWorkerSimulation(SIMULATION_ITERATIONS, [moddedWeapon], targetUnit);

                        // exports specific run to telemetry
                        dispatchTelemetryEvent(startTime, results, [moddedWeapon], targetUnit, AuthState, "delta_analysis", batchId);

                        loadDataIntoSQL(unitName, modKey, "Hit", results.hitDistribution);
                        loadDataIntoSQL(unitName, modKey, "Wound", results.woundDistribution);
                        loadDataIntoSQL(unitName, modKey, "Save", results.saveDistribution);
                        loadDataIntoSQL(unitName, modKey, "Damage", results.damageDistribution);
                        loadDataIntoSQL(unitName, modKey, "ModelsKilled", results.killedDistribution);
                        loadAveragesIntoSQL(unitName, modKey, results.averages);
                    }
                }

                //target mods
                //iterate through every available mod to simulate and check how effectively it reduces the base profile's damage/models killed
                for (const [category, mods] of Object.entries(target_SIMULATION_SCENARIOS)) {
                    for (const modKey of mods) {
                        const skipReason = checkSkipReasonTarget(targetUnit, [baseWeapon], modKey);
                        if (skipReason === "not_applicable") continue;

                        if (category === "Save/Ap") allowedSaveMods.push(modKey);
                        if (category === "Damage Mods") {
                            allowedDamageMods.push(modKey);
                            allowedKilledMods.push(modKey);
                        }

                        if (skipReason) {
                            skippedMods[modKey] = skipReason;
                            continue;
                        }

                        let moddedTarget = structuredClone(targetUnit);
                        applyModifiersToTarget(moddedTarget, modKey);

                        let results = await runWorkerSimulation(SIMULATION_ITERATIONS, [baseWeapon], moddedTarget);

                        dispatchTelemetryEvent(startTime, results, [baseWeapon], moddedTarget, AuthState, "delta_analysis", batchId);

                        loadDataIntoSQL(unitName, modKey, "Hit", results.hitDistribution);
                        loadDataIntoSQL(unitName, modKey, "Wound", results.woundDistribution);
                        loadDataIntoSQL(unitName, modKey, "Save", results.saveDistribution);
                        loadDataIntoSQL(unitName, modKey, "Damage", results.damageDistribution);
                        loadDataIntoSQL(unitName, modKey, "ModelsKilled", results.killedDistribution);
                        loadAveragesIntoSQL(unitName, modKey, results.averages);
                    }
                }

                // queryComparisonData from db-manager.js
                const sqlData = queryComparisonData(unitName);

                // queryAveragesData from db-manager.js
                const sqlAvgData = queryAveragesData(unitName);

                const attackerUnitReport = unitAccordion.querySelector('.unit-reports-wrapper');

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

            const mainContainer = document.getElementById("advanced-reports-container");

            // spawnLeaderboard from ui-manager.js
            spawnLeaderboard(mainContainer, leaderboardStats, isSingleTarget);


        } catch (error) {
            console.error("Pipeline Failed:", error);
            alert("Pipeline Failed.");
        }

        advAnalyticsBtn.textContent = getCurrentTheme().btnAdvancedText;
        setSimulationButtonsState(false);
    });
}

//#endregion

//#region report html generators >>>>>>>>>>>>>>>>>>>>>>>

// generates dynamic tables based on allowed mods and skip reasons
function generateAdvancedReport(title, category, sqlData, sqlAvgData, totalRuns, allowedMods, skippedMods, statsHTML, targetContainer, isSingleTarget = false) {
    const baseRow = sqlAvgData.find(r => r.modifier_name === "Base");

    const processedRows = allowedMods.map(modName => {
        let skipReason = skippedMods[modName] || null;
        let dataRow = skipReason ? baseRow : sqlAvgData.find(r => r.modifier_name === modName);

        return { ...dataRow, modifier_name: modName, skipReason: skipReason };
    }).filter(r => r.unit_name);


    const th = `padding: 8px 4px 8px 6px; color: var(--theme-text-muted); font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--border-color);`;
    const td = `padding: 10px 4px 10px 6px; background: rgba(255,255,255,0.03); color: #fff; font-weight: bold; margin-bottom: 5px;`;
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

    } else if (category === "Wound") {
        const hasDev = processedRows.some(r => r.wounds_dev > 0);
        const hasAuto = processedRows.some(r => r.hits_auto > 0);

        let headers = `<th style="${th}">Rule</th><th style="${th}">Avg Total Wounds</th>`;
        if (hasDev) headers += `<th style="${th}">Inc. Devastating</th>`;
        if (hasAuto) headers += `<th style="${th}">Inc. Lethal</th>`;

        avgStatsHTML += `<tr>${headers}</tr>`;

        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;
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

    } else if (category === "Save") {
        avgStatsHTML += `<tr><th style="${th}">Rule</th><th style="${th}">Saves Forced</th><th style="${th}">Passed</th><th style="${th}">Failed (Dmg)</th></tr>`;

        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;
            avgStatsHTML += `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td><td style="${td}">${row.saves_forced.toFixed(2)}</td><td style="${td}">${row.saves_passed.toFixed(2)}</td><td style="${tdLast}">${row.saves_failed.toFixed(2)}</td></tr>`;
        });

    } else if (category === "Damage") {
        avgStatsHTML += `<tr><th style="${th}">Rule</th><th style="${th}">Avg Total Damage</th></tr>`;

        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;
            avgStatsHTML += `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td><td style="${tdLast}">${row.avg_damage.toFixed(2)}</td></tr>`;
        });

    } else if (category === "ModelsKilled") {
        const killHeader = isSingleTarget ? "Probability to Kill" : "Expected Models Killed";

        avgStatsHTML += `<tr><th style="${th}">Rule</th><th style="${th}">${killHeader}</th><th style="${th}">Overkill</th><th style="${th}">Efficiency</th></tr>`;

        processedRows.forEach(row => {
            let rowStyle = row.skipReason ? `opacity: 0.5;` : ``;
            const killValue = isSingleTarget ? (row.avg_killed * 100).toFixed(1) + "%" : row.avg_killed.toFixed(3);

            avgStatsHTML += `<tr style="${rowStyle}"><td style="${tdFirst}">${getRowNameHTML(row)}</td><td style="${td}">${killValue}</td><td style="${td}">${row.avg_wasted.toFixed(2)}</td><td style="${tdLast}">${row.efficiency}%</td></tr>`;
        });
    }

    avgStatsHTML += `</table>`;

    // spawnReportCard from ui-manager.js
    const card = spawnReportCard(title, targetContainer, statsHTML, avgStatsHTML);
    const chartMods = allowedMods.filter(m => !skippedMods[m]);

    // renderAdvancedChart from chart-manager.js
    renderAdvancedChart(card.querySelector('.adv-chart'), category, sqlData, totalRuns, chartMods, isSingleTarget);
}

// generates the core stat display for the top of the report cards dynamically via registry
function buildBaseStatsHTML(weaponsArray, targetUnit) {
    let html = `<div style="display: flex; gap: 10px; flex-wrap: wrap; width: 100%;">`;

    weaponsArray.forEach(w => {
        let activeMods = [];

        // gather attacker mods from the registry
        for (const key in ModifierRegistry) {
            if (ModifierRegistry[key].getUITextAttacker) {
                const text = ModifierRegistry[key].getUITextAttacker(w);
                // check for duplicates
                if (text && !activeMods.includes(text)) activeMods.push(text);
            }
        }

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

    // gather target mods from the registry
    for (const key in ModifierRegistry) {
        if (ModifierRegistry[key].getUITextTarget) {
            const text = ModifierRegistry[key].getUITextTarget(targetUnit);
            if (text && !targetMods.includes(text)) targetMods.push(text);
        }
    }

    let targetModsStr = targetMods.length > 0 ? targetMods.join(' | ') : "[No Mods]";

    html += `
    <div style="flex: 1; min-width: 180px; background: rgba(0,0,0,0.2); padding: 6px 12px; border-radius: 4px; border-left: 3px solid var(--theme-btn-standard); display: flex; flex-direction: column; justify-content: center;">
        <div style="color: var(--theme-text-muted); font-size: 0.65rem; font-weight: bold; text-transform: uppercase;">Target Profile</div>
        <div style="font-size: 0.85rem; color: #fff; font-weight: bold; margin: 2px 0;">
            T${targetUnit.toughness}  |  W${targetUnit.wounds}  |  SV ${targetUnit.save}+ ${targetUnit.inVul ? ' |  ' + targetUnit.inVul + '++' : ''}
        </div>
        <div style="color: var(--theme-btn-standard); font-size: 0.7rem; font-weight: bold;">${targetModsStr}</div>
    </div></div>`;

    return html;
}

//#endregion

//#region data management >>>>>>>>>>>>>>>>>>>>>>>

// serialize and save state
function exportRoster() {
    const globalDrop = document.getElementById("global-mod-dropdown");

    const exportState = {
        roster: createWeaponsArray(),
        target: createUnit(),
        globalRule: globalDrop ? globalDrop.value : "none"
    };

    let fileName = RosterNameInput.value.trim();
    if (!fileName.endsWith(".json")) fileName += ".json";

    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: "application/json" });
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
                // buildRosterFromJSON from ui-manager.js
                buildRosterFromJSON(RosterContainer, jsonData, false);
            } else {
                buildRosterFromJSON(RosterContainer, jsonData.roster, false);

                if (jsonData.target) loadTargetProfile(jsonData.target);

                if (jsonData.globalRule) {
                    const globalDrop = document.getElementById("global-mod-dropdown");
                    if (globalDrop) globalDrop.value = jsonData.globalRule;
                }
            }

            // syncAppUI from ui-manager.js
            syncAppUI();

            setTimeout(() => document.dispatchEvent(new CustomEvent("App:AutoSave")), 100);

        } catch (error) {
            alert("Invalid JSON file! Could not parse roster.");
        }
    };

    reader.readAsText(file);
}

// save current dashboard state to local storage
function autoSave() {
    try {
        const globalDrop = document.getElementById("global-mod-dropdown");

        let currentTab = "tab-standard";
        if (document.getElementById("view-combinatorial") && document.getElementById("view-combinatorial").style.display === "block") {
            currentTab = "tab-combinatorial";
        }

        const rosterState = {
            roster: createWeaponsArray(),
            target: createUnit(),
            globalRule: globalDrop ? globalDrop.value : "none",
            combiBuckets: typeof scrapeCombinatorialSelections === "function" ? scrapeCombinatorialSelections() : null,
            combiRoster: activeCombiWeapons,
            combiTarget: activeCombiTarget,
            activeTab: currentTab
        };

        localStorage.setItem("40kRoster", JSON.stringify(rosterState, null, 2));

    } catch (error) {
        console.error("Failed to auto-save:", error);
    }
}

// restore state from local storage on load
if (localStorage.getItem("40kRoster")) {
    const loadSavedRoster = localStorage.getItem("40kRoster");

    try {
        const jsonData = JSON.parse(loadSavedRoster);

        if (Array.isArray(jsonData)) {
            buildRosterFromJSON(RosterContainer, jsonData);
        } else {
            buildRosterFromJSON(RosterContainer, jsonData.roster);

            if (jsonData.target) loadTargetProfile(jsonData.target);

            if (jsonData.globalRule) {
                const globalDrop = document.getElementById("global-mod-dropdown");
                if (globalDrop) globalDrop.value = jsonData.globalRule;
            }

            if (jsonData.combiBuckets) {
                const moveMods = (arr, targetId) => {
                    const target = document.getElementById(targetId);
                    if (target && arr) {
                        arr.forEach(modKey => {
                            const el = document.querySelector(`[data-mod="${modKey}"]`);
                            if (el) target.appendChild(el);
                        });
                    }
                };

                moveMods(jsonData.combiBuckets.independent, 'bucket-independent');
                moveMods(jsonData.combiBuckets.mutExclusiveA, 'bucket-exclusive-a');
                moveMods(jsonData.combiBuckets.mutExclusiveB, 'bucket-exclusive-b');
                moveMods(jsonData.combiBuckets.mutExclusiveC, 'bucket-exclusive-c');
                moveMods(jsonData.combiBuckets.inclusiveA, 'bucket-inclusive-a');
                moveMods(jsonData.combiBuckets.inclusiveB, 'bucket-inclusive-b');
                moveMods(jsonData.combiBuckets.inclusiveC, 'bucket-inclusive-c');
            }

            if (jsonData.combiRoster && jsonData.combiTarget) {
                activeCombiWeapons = jsonData.combiRoster;
                activeCombiTarget = jsonData.combiTarget;

                // renderCombiMirror from ui-manager.js
                renderCombiMirror(activeCombiWeapons, activeCombiTarget);
            }
        }

        if (jsonData.activeTab) {
            if (jsonData.activeTab === "tab-combinatorial") {
                // switchDashboardView from ui-manager.js
                switchDashboardView("tab-combinatorial", "view-combinatorial");
            } else if (jsonData.activeTab === "tab-dataloom") {
                switchDashboardView("tab-dataloom", "view-dataloom");
            } else {
                switchDashboardView("tab-standard", "view-standard");
            }
        }

        if (ImportInput) ImportInput.value = "";

    } catch (error) {
        console.error("Save Data Crashed. Error details:", error);
    }
} else {
    // addAttackerModule from ui-manager.js
    addAttackerModule(RosterContainer);
}

function clearDashboard() {
    localStorage.removeItem("40kRoster");
    RosterContainer.innerHTML = '';

    addAttackerModule(RosterContainer);

    const targetNameInput = document.getElementById("target-name");
    if (targetNameInput) targetNameInput.value = "Target Unit";

    document.getElementById("toughness").value = 4;
    document.getElementById("wounds").value = 2;
    document.getElementById("save").value = 3;
    document.getElementById("inVul").value = "";
    document.getElementById("target-models").value = 5;
    document.getElementById("def-fnp").value = "0";

    // clear all target checkboxes
    for (const id of Object.keys(TARGET_CHECKBOXES)) {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    }

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

document.addEventListener("App:ClearDashboard", clearDashboard);

if (ClearBtn) {
    ClearBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all units and reset the dashboard?")) {
            clearDashboard();
        }
    });
}

//#endregion

//#region combi engine >>>>>>>>>>>>>>>>>>>>>>>

const SyncCombiBtn = document.getElementById("sync-combi-roster-btn");

if (SyncCombiBtn) {
    SyncCombiBtn.addEventListener("click", () => {
        const allCleanWeapons = createWeaponsArray(true);
        activeCombiTarget = createUnit();

        activeCombiWeapons = [];
        const modules = document.querySelectorAll('.attacker-module');

        modules.forEach((mod, index) => {
            const toggle = mod.querySelector('.in-combi-roster');

            if (toggle && toggle.checked && allCleanWeapons[index]) {
                activeCombiWeapons.push(allCleanWeapons[index]);
            }
        });

        if (activeCombiWeapons.length === 0) {
            alert("No units selected.");
            return;
        }

        if (activeCombiWeapons.length > 4) {
            alert("Maximum of 4 units allowed.");
        }

        renderCombiMirror(activeCombiWeapons, activeCombiTarget);
        document.dispatchEvent(new CustomEvent("App:AutoSave"));
    });
}

const ResetCombiBtn = document.getElementById("reset-combi-btn");

if (ResetCombiBtn) {
    ResetCombiBtn.addEventListener("click", () => {
        if (!confirm("Are you sure you want to reset the Combinatorial Engine?")) return;

        activeCombiWeapons = [];
        activeCombiTarget = null;

        const mirrorContainer = document.getElementById("combi-mirror-container");
        if (mirrorContainer) mirrorContainer.innerHTML = "";

        const resultsContainer = document.getElementById("combinatorial-results-container");
        if (resultsContainer) resultsContainer.innerHTML = "";

        const simCounterDisplay = document.getElementById("sim-counter-display");
        if (simCounterDisplay) simCounterDisplay.textContent = "0";

        const allDraggables = document.querySelectorAll('.draggable-mod');
        allDraggables.forEach(mod => {
            const category = mod.getAttribute('data-category');
            if (category) {
                const homePool = document.getElementById(`pool-${category}`);
                if (homePool) {
                    homePool.appendChild(mod);
                }
            }
        });

        document.dispatchEvent(new CustomEvent("App:AutoSave"));
    });
}

const combiButton = document.getElementById("run-combinatorial-btn");
const simCounterDisplay = document.getElementById("sim-counter-display");

if (combiButton) {
    combiButton.addEventListener("click", async () => {
        if (activeCombiWeapons.length === 0 || !activeCombiTarget) {
            alert("Please sync the Combi Roster first.");
            return;
        }

        document.dispatchEvent(new CustomEvent("App:AutoSave"));

        setSimulationButtonsState(true);
        combiButton.textContent = "CALCULATING PERMUTATIONS...";

        if (simCounterDisplay) simCounterDisplay.textContent = "0";

        //start timer
        const startTime = startTelemetryTimer();
        const batchId = generateId();

        try {
            // scrapeCombinatorialSelections from combinatorial-engine.js
            const selectedMods = scrapeCombinatorialSelections();
            const allWeaponsLeaderboard = [];
            let totalSimulationsRun = 0;

            const attackGroups = [];
            const processedIds = new Set();

            activeCombiWeapons.forEach(w => {
                if (!w.isLeader) {
                    const group = [w];
                    processedIds.add(w.unitId);

                    const leaderNames = [];

                    activeCombiWeapons.forEach(lw => {
                        // link leaders using attachTargetId
                        if (lw.isLeader && lw.attachTargetId === w.unitId) {
                            group.push(lw);
                            leaderNames.push(lw.unitName);
                            processedIds.add(lw.unitId);
                        }
                    });

                    let groupTitle = w.unitName;
                    if (leaderNames.length > 0) {
                        groupTitle = `${leaderNames.join(", ")} leading: ${w.unitName}`;
                    }

                    attackGroups.push({ groupName: groupTitle, weapons: group });
                }
            });

            activeCombiWeapons.forEach(w => {
                if (w.isLeader && !processedIds.has(w.unitId)) {
                    attackGroups.push({ groupName: w.unitName + " (Solo)", weapons: [w] });
                }
            });

            for (const attackGroup of attackGroups) {
                // generateCombinations from combinatorial-engine.js
                const comboYield = generateCombinations(
                    selectedMods.independent,
                    selectedMods.mutExclusiveA,
                    selectedMods.mutExclusiveB,
                    selectedMods.mutExclusiveC,
                    selectedMods.inclusiveA,
                    selectedMods.inclusiveB,
                    selectedMods.inclusiveC
                );

                const masterCompArray = [];
                const worker = new Worker(new URL('./webWorker.js', import.meta.url), { type: 'module' });

                for (const mod of comboYield) {
                    let moddedWeapons = structuredClone(attackGroup.weapons);
                    let isInvalidCombo = false;

                    for (const modKey of mod) {
                        moddedWeapons.forEach(mw => applyModifierToWeapon(mw, modKey, activeCombiTarget));
                    }

                    // filter out mathematically invalid combinations
                    moddedWeapons.forEach(mw => {
                        const canFishHits = (mw.modifiers.lethal || mw.modifiers.sustained > 0) &&
                            (mw.modifiers.rerollHits !== "none");

                        const canFishWounds = mw.modifiers.devastating &&
                            (mw.modifiers.rerollWounds !== "none" || mw.modifiers.twinLinked);

                        if (mw.modifiers.fishForCrits && !canFishHits && !canFishWounds) {
                            isInvalidCombo = true;
                        }
                    });

                    if (isInvalidCombo) continue;

                    const payload = {
                        targetUnit: activeCombiTarget,
                        weaponsArray: moddedWeapons,
                        iterations: SIMULATION_ITERATIONS
                    };

                    const workerResult = await new Promise((resolve, reject) => {
                        worker.onmessage = (e) => resolve(e.data);
                        worker.onerror = (err) => reject(err);
                        worker.postMessage(payload);
                    });

                    // export specific permutation to telemetry
                    dispatchTelemetryEvent(startTime, workerResult, moddedWeapons, activeCombiTarget, AuthState, "combinatorial_engine", batchId);

                    masterCompArray.push([mod, workerResult]);

                    totalSimulationsRun += SIMULATION_ITERATIONS;
                    if (simCounterDisplay) simCounterDisplay.textContent = totalSimulationsRun.toLocaleString();
                }

                worker.terminate();

                masterCompArray.sort((a, b) => {
                    if (b[1].averages.killed !== a[1].averages.killed) {
                        return b[1].averages.killed - a[1].averages.killed;
                    }

                    if (b[1].averages.damage !== a[1].averages.damage) {
                        return b[1].averages.damage - a[1].averages.damage;
                    }

                    return a[0].length - b[0].length;
                });

                const topThree = masterCompArray.slice(0, 10);
                const baseCombo = masterCompArray.find(c => c[0].length === 0);
                const baseResult = baseCombo ? baseCombo[1] : null;

                allWeaponsLeaderboard.push({
                    groupName: attackGroup.groupName,
                    topCombos: topThree,
                    baseResult: baseResult
                });
            }

            // renderCombinatorialLeaderboard from ui-manager.js
            renderCombinatorialLeaderboard(allWeaponsLeaderboard, totalSimulationsRun, selectedMods);



        } catch (error) {
            console.error("Combinatorial Engine Failed:", error);
            alert("An error occurred during permutations. Check your console for details.");
        } finally {
            combiButton.textContent = "RUN PERMUTATIONS";
            setSimulationButtonsState(false);
        }
    });
}

//#endregion