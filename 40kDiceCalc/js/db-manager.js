const SIMULATION_ITERATIONS = 50000;


//In-Memory SQLite Database via WebAssembly
let db;

//create db and get needed sql.js
export async function initDataBase() {

    try {
        const SQL = await initSqlJs({//oad sql.js library
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        db = new SQL.Database();

        db.run(`
    CREATE TABLE simulation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modifier_name TEXT,
        category TEXT,          -- hit, wound, or save
        metric_name TEXT,       -- rawSuccesses, devWounds, etc.
        value INTEGER,
        occurrence_count INTEGER
    );
`);
        console.log("SQLite Database Initialized");
    } catch (error) {
        console.error("Failed to initialize SQLite:", error);


    }

}
//load
export function loadDataIntoSQL(modifierName, category, metrics) {
    if (!db) {
        console.error("Database not ready");
        return;
    }

    //using prepare statement (?,?,?) - prevent sql query code being inserted
    const stmt = db.prepare(`
        INSERT INTO simulation_runs (modifier_name, category, metric_name, value, occurrence_count) 
        VALUES (?, ?, ?, ?, ?)
    `);
    // actual loading
    for (const [metricName, value] of Object.entries(metrics)) {
        stmt.run([modifierName, category, metricName, value, 1]);
    }

    //dump garbage safty 
    stmt.free();
    console.log(`Loaded [${category}] metrics for [${modifierName}]`);

}

export function spawnReportCard(container, categoryTitle) {
    const cardHTML = `
        <div class="report-card" style="margin-bottom: 30px; display: grid; grid-template-columns: 200px 1fr; gap: 20px;">
            <div class="stats-sidebar">
                <h3>${categoryTitle}</h3>
                <div class="mod-stats-list"></div>
            </div>
            <div style="height: 300px;">
                <canvas class="adv-chart"></canvas>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHTML);
    return container.lastElementChild;
}


export function generateAdvancedReport(category, sqlData) {
    const container = document.getElementById("advanced-reports-container");
    const card = spawnReportCard(container, category);
    const categoryData = sqlData.filter(row => row[2] === category);
    renderAdvancedChart(card.querySelector('.adv-chart'), categoryData);

}

export function queryComparisonData() {

    const result = db.exec(`
        SELECT modifier_name, damage_amount, category, metric_name, occurrence_count
        FROM simulation_runs
        ORDER BY modifier_name ASC, damage_amount ASC;
    `);
    return result.length === 0 ? [] : result[0].values;


}


export const ModLabels = {
    "Base": "Base Profile",
    "hit_plus_1": "+1 to Hit",
    "reroll_hits_1": "Reroll 1s (Hit)",
    "reroll_hits_all": "Reroll All Hits",
    "sustained_hits": "Sustained Hits 1",
    "wound_plus_1": "+1 to Wound",
    "reroll_wounds_1": "Reroll 1s (Wound)",
    "reroll_wounds_all": "Reroll All Wounds",
    "lethal": "Lethal Hits",
    "extra_ap_1": "AP -1",
    "devastating": "Devastating Wounds"
};

export function clearDataBase() {

    if (db) {
        db.run("DELETE FROM simulation_runs;");

    }

}