// manages the in-memory sqlite database, data formatting, and querying.

const SIMULATION_ITERATIONS = 100000;


//In-Memory SQLite Database via WebAssembly
let db;

export async function initDataBase() {
    try {
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
        db = new SQL.Database();
        db.run(`
            CREATE TABLE simulation_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_name TEXT,
                modifier_name TEXT,
                category TEXT,
                value INTEGER,
                occurrence_count INTEGER
            );
            CREATE TABLE simulation_averages (
                unit_name TEXT,
                modifier_name TEXT,
                avg_damage REAL,
                avg_killed REAL,
                avg_wasted REAL,
                efficiency REAL,
                hits_success REAL,
                hits_bonus REAL,
                hits_auto REAL,
                wounds_success REAL,
                wounds_dev REAL,
                saves_forced REAL,
                saves_passed REAL,
                saves_failed REAL
            );
        `);
        console.log("SQLite Database Initialized");
    } catch (error) { console.error("Failed to initialize SQLite:", error); }
}
//for distibution
export function loadDataIntoSQL(unitName, modifierName, category, distribution) {
    if (!db) return;
    const stmt = db.prepare(`INSERT INTO simulation_runs (unit_name, modifier_name, category, value, occurrence_count) VALUES (?, ?, ?, ?, ?)`);

    // Convert distribution { "5": 1200 } into rows
    for (const [amount, count] of Object.entries(distribution)) {
        stmt.run([unitName, modifierName, category, parseInt(amount, 10), count]);
    }
    stmt.free();
}

//for averages
export function loadAveragesIntoSQL(unitName, modifierName, averages) {
    if (!db) return;
    const stmt = db.prepare(`
        INSERT INTO simulation_averages (
            unit_name, modifier_name, avg_damage, avg_killed, avg_wasted, efficiency,
            hits_success, hits_bonus, hits_auto, wounds_success, wounds_dev,
            saves_forced, saves_passed, saves_failed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
        unitName, modifierName, averages.damage, averages.killed, averages.wasted, averages.efficiency,
        averages.hits_success, averages.hits_bonus, averages.hits_auto,
        averages.wounds_success, averages.wounds_dev,
        averages.saves_forced, averages.saves_passed, averages.saves_failed
    ]);
    stmt.free();
}

//for distibution
export function queryComparisonData(unitName) {
    const result = db.exec(`
        SELECT modifier_name, value, category, occurrence_count 
        FROM simulation_runs 
        WHERE unit_name = '${unitName}' 
        ORDER BY modifier_name ASC, value ASC;
    `);
    return result.length === 0 ? [] : result[0].values;
}
//for averages
export function queryAveragesData(unitName) {
    const result = db.exec(`SELECT * FROM simulation_averages WHERE unit_name = '${unitName}';`);
    if (result.length === 0) return [];

    // convert SQL arrays back into JS objects
    const columns = result[0].columns;
    return result[0].values.map(row => {
        let obj = {};
        columns.forEach((col, index) => {
            obj[col] = row[index];
        });
        return obj;
    });
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
    "devastating": "Devastating Wounds",
    "melta_range": "In melta range",
    "hit_minus_1": "Target: -1 to Hit",
    "cover": "Target: Cover",
    "wound_minus_1": "Target: -1 to wound",
    "SgT_wound_minus_1": "Target: -1 to wound(S > T) ",
    "damage_minus_1": "Target: -1 Damage",
    "damage_half": "Target: Half Damage",
    "FNP": "Target: Feel No Pain 5+"
};

export function clearDataBase() {

    if (db) {
        db.run("DELETE FROM simulation_runs;");
        db.run("DELETE FROM simulation_averages;");

    }

}