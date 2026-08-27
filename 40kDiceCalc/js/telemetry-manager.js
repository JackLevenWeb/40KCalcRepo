// telemetry-manager.js

// placeholder for local FastAPI / backend endpoint
const azureEndpoint = "http://localhost:8080/api/telemetry";

// unique string for database tracking
export function generateId() {
    return crypto.randomUUID();
}

export function startTelemetryTimer() {
    return performance.now();
}

// calculates time and dispatches event
export function dispatchTelemetryEvent(startTime, results, attackers, target, auth, simType, batchId) {
    const executionTime = performance.now() - startTime;

    const telemetryBundle = {
        results: results,
        attackers: attackers,
        target: target,
        auth: auth,
        executionTime: executionTime,
        simType: simType,
        batchId: batchId
    };

    document.dispatchEvent(new CustomEvent("App:ExportTelemetry", { detail: telemetryBundle }));
}

// trigger data export
export function initializeTelemetry() {
    document.addEventListener("App:ExportTelemetry", (event) => {
        const simulationData = event.detail;
        // buildAndSendPayLoad(simulationData);
    });
}

// map and package raw data with retry transmission
async function buildAndSendPayLoad(data) {
    const runId = generateId();
    const timeStamp = new Date().toISOString();
    const concurrency = navigator.hardwareConcurrency || 1;

    // build payload 
    const finalPayload = {
        session_data: {
            run_id: runId,
            batch_id: data.batchId,
            user_id: data.auth.userId,
            timeStamp: timeStamp,
            app_version: data.auth.appVersion
        },
        performance_metrics: {
            execution_time_ms: data.executionTime,
            device_concurrency: concurrency
        },
        simulation_parameters: {
            simulation_type: data.simType,
            total_iterations: data.results.SimulatedRuns,
            target_unit: {
                name: data.target.name,
                faction: data.target.faction,
                wounds: data.target.wounds,
                toughness: data.target.toughness,
                save: data.target.save,
                def_minus_hit: data.target.modifiers?.minusOneHit || false,
                def_minus_wound: data.target.modifiers?.minusOneWound || false,
                def_minus_wound_str: data.target.modifiers?.minusOneWoundHighStr || false,
                def_cover: data.target.modifiers?.cover || false,
                def_plus_one_save: data.target.modifiers?.plusOneSave || false
            },
            attacker_units: data.attackers.map(attacker => ({
                unit_id: attacker.unitId,
                name: attacker.unitName,
                faction: attacker.faction,
                models: attacker.modelCount,
                attacks: attacker.attack,
                bs_ws: attacker.BsWs,
                strength: attacker.strength,
                ap: attacker.Ap,
                damage: attacker.damage,
                unit_count: attacker.unitCount,
                is_leader: attacker.isLeader,
                attach_target_id: attacker.attachTargetId,
                granted_keyword: attacker.grantedKeyword,
                modifiers: {
                    lethal: attacker.modifiers.lethal,
                    devastating: attacker.modifiers.devastating,
                    torrent: attacker.modifiers.torrent,
                    twin_linked: attacker.modifiers.twinLinked,
                    blast: attacker.modifiers.blast,
                    cleave: attacker.modifiers.cleave,
                    lance: attacker.modifiers.lance,
                    sustained: attacker.modifiers.sustained,
                    melta: attacker.modifiers.melta,
                    rapid_fire: attacker.modifiers.rapidFire,
                    anti: attacker.modifiers.anti,
                    hit_mod: attacker.modifiers.hitMod,
                    wound_mod: attacker.modifiers.woundMod,
                    crit_hit_threshold: attacker.modifiers.critHitThreshold,
                    crit_wound_threshold: attacker.modifiers.critWoundThreshold,
                    reroll_hits: attacker.modifiers.rerollHits,
                    reroll_wounds: attacker.modifiers.rerollWounds,
                    fish_for_crits: attacker.modifiers.fishForCrits
                }
            }))
        },
        phase_aggregates: {
            attacks_rolled: data.results.totals?.sumAttacks || 0,
            hits_raw_successes: data.results.totals?.sumHits?.rawSuccesses || 0,
            hits_bonus_hits: data.results.totals?.sumHits?.bonusHits || 0,
            hits_auto_wounds: data.results.totals?.sumHits?.autoWounds || 0,
            wounds_raw_successes: data.results.totals?.sumWounds?.rawSuccesses || 0,
            wounds_dev_wounds: data.results.totals?.sumWounds?.devWounds || 0,
            wounds_normal_wounds: data.results.totals?.sumWounds?.normalWounds || 0,
            saves_failed_count: data.results.totals?.sumSaves?.failedSavesCount || 0,
            damage_total: data.results.averages?.damage || 0,
            damage_models_killed: data.results.averages?.killed || 0,
            damage_wasted: data.results.averages?.wasted || 0,
            final_health: 0
        },
        raw_data: {
            hit_distribution: data.results.hitDistribution,
            wound_distribution: data.results.woundDistribution,
            save_distribution: data.results.saveDistribution,
            damage_distribution: data.results.damageDistribution,
            killed_distribution: data.results.killedDistribution
        }
    };

    // helper to pause execution asynchronously
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const maxRetries = 3;
    const retryDelayMs = 2000;

    // Execute transmission with retry loop
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[Telemetry] Attempt ${attempt} of ${maxRetries} sending to ${azureEndpoint}...`);

            const response = await fetch(azureEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(finalPayload)
            });

            if (!response.ok) {
                throw new Error(`Server responded with HTTP status ${response.status}`);
            }

            console.log("[Telemetry] Payload delivered successfully!");
            break; // exit loop on success
        } catch (error) {
            console.warn(`[Telemetry] Attempt ${attempt} failed: ${error.message}`);

            if (attempt < maxRetries) {
                console.log(`[Telemetry] Retrying in ${retryDelayMs / 1000} seconds...`);
                await sleep(retryDelayMs);
            } else {
                console.error("[Telemetry] Maximum retries reached. Transmission aborted.");
            }
        }
    }
}