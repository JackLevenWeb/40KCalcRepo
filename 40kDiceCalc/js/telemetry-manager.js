
// placeholder for azure function endpoint
const azureEndpoint = "https://your-azure-function-app.azurewebsites.net/api/telemetry";



//unique string for database tracking
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

//trigger data export
export function initializeTelemetry() {
    document.addEventListener("App:ExportTelemetry", (event) => {

        const simulationData = event.detail;
        buildAndSendPayLoad(simulationData);


    });

}


//map and package raw data
async function buildAndSendPayLoad(data) {

    const runId = generateId();
    const timeStamp = new Date().toISOString();


    const concurrency = navigator.hardwareConcurrency || 1;


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
                modifiers: data.target.modifiers
            },
            attacker_units: data.attackers.map(attacker => ({
                name: attacker.unitName,
                faction: attacker.faction,
                models: attacker.modelCount,
                attacks: attacker.attack,
                modifiers: attacker.modifiers
            }))
        },
        raw_data: {
            hit_distribution: data.results.hitDistribution,
            wound_distribution: data.results.woundDistribution,
            save_distribution: data.results.saveDistribution,
            damage_distribution: data.results.damageDistribution,
            killed_distribution: data.results.killedDistribution
        }
    };


    // try {
    //     const respone = await fetch(azureEndpoint, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify(finalPayload)
    //     });

    //     if (!response.ok) {
    //         console.error("telemetry export failed with status", response.status);
    //     }
    // } catch (error) {
    //     console.error("network error during telemetry export", error);
    // }

    // console.log("final telemetry payload ready for azure", finalPayload);

}


