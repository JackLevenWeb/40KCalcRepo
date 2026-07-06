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
    CREATE TABLE simulation_runs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modifier_name TEXT,
    damage_amount INTEGER,
    occurrence_count INTEGER)`);
        console.log("SQLite Database Initialized");
    } catch (error) {
        console.error("Failed to initialize SQLite:", error);


    }

}
//load
export function loadDataIntoSQL(modifierName, distributionData) {
    if (!db) {
        console.error("Database not ready");
        return;
    }

    //using prepare statement (?,?,?) - prevent sql query code being inserted
    const stmt = db.prepare("INSERT INTO simulation_runs (modifier_name, damage_amount, occurrence_count)VALUES (?, ?, ?)");

    // actual loading
    for (const [damage, count] of Object.entries(distributionData)) {
        stmt.run([modifierName, parseInt(damage, 10), count]);
    }

    //garbage collection for sqLite
    stmt.free();
    console.log(`${SIMULATION_ITERATIONS} runs loaded for [${modifierName}]`);

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
        db.run("DELETE FROM simulation_runs;");

    }

}