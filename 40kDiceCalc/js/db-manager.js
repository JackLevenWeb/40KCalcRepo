//In-Memory SQLite Database via WebAssembly
let db;

export async function initDataBase() {

    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        db = new SQL.initDataBase();

        db.run(`
    CREATE TABLE simulation_runs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modifier_name TEXT,
    damage_amout INTEGER,
    occurrence_count INTEGER)`);
        console.log("SQLite Database Initialized");
    } catch {
        console.error("Failed to initialize SQLite:", error);


    }

}

export function loadDataIntoSQL(modifierName, distributionData) {
    if (!db) {
        console.error("Database not ready");
        return;
    }

    for (const [damage, count] of Object.entries(distributionData)) {
        stmt.run([modifierName, parseInt(damage, 10), count])

    }

    //free statement
    stmt.free();
    console.log(`50000 runs loaded for [${modifierName}]`);

}

export function queryComparisonData() {

    const result = db.exec(`
    SELECT modifier_name, damage_amount, occurrence_count
    FROM simulation_runs
    ORDER BY modifier_name ASC, damage_amount ASC;`);

    if (result.length === 0) return [];

    return result[0].values;


}

export function clearDataBase() {

    if (db) {
        db.run("DELETE FROM simulated_runs;");

    }

}