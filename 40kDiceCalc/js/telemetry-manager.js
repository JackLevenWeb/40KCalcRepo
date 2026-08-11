

//unique string for database tracking
export function generateRunId() {
    return crypto.randomUUID();
}

export function startTelemetryTimer() {
    return performance.now();
}


//trigger data export
export function initializeTelemetry() {
    document.addEventListener("App:ExportTelemetry", (event) => {

        const simulationData = event.detail;
        buildAndSendPayLoad(simulationData);


    });

}


//packages the raw data
async function buildAndSendPayLoad(data) {

    const runId = generateRunId();
    console.log("exporting telemetry for run id", runId);
    console.log("raw simulation data received", data);

}