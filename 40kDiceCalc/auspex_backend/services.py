import pyodbc
import uuid

def process_telemetry_payload(conn_string, payload):
    # initialize variables for safety
    conn = None
    cursor = None
    
    try:
        # open database connection
        conn = pyodbc.connect(conn_string)
        cursor = conn.cursor()
        
        # extract top level objects safely
        session = payload.get("session_data", {})
        perf = payload.get("performance_metrics", {})
        params = payload.get("simulation_parameters", {})
        target = params.get("target_unit", {})
        raw_data = payload.get("raw_data", {})
        
        run_id = session.get("run_id")
        
        # 1 insert parent record including target stats
        cursor.execute("""
            INSERT INTO silver_simulations (
                runid, batchid, userid, timestamp, appversion,
                executiontimems, deviceconcurrency, simulationtype, totaliterations,
                targetname, targetfaction, targetwounds, targettoughness, targetsave
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, 
            run_id, 
            session.get("batch_id"), 
            session.get("user_id"),
            session.get("timeStamp"),
            session.get("app_version"),
            perf.get("execution_time_ms"),
            perf.get("device_concurrency"),
            params.get("simulation_type"),
            params.get("total_iterations"),
            target.get("name"),
            target.get("faction"),
            target.get("wounds"),
            target.get("toughness"),
            target.get("save")
        )
        
        # 2 loop through attackers array and insert child records
        attackers = params.get("attacker_units", [])
        
        for attacker in attackers:
            cursor.execute("""
                INSERT INTO silver_attackers (runid, attackername, attackerfaction, models, attacks)
                VALUES (?, ?, ?, ?, ?)
            """, 
                run_id, 
                attacker.get("name"), 
                attacker.get("faction"),
                attacker.get("models"), 
                attacker.get("attacks")
            )
            
        # 3 loop through distributions and insert child records
        # helper function to keep our code dry
        def insert_distributions(category_name, dist_dict):
            for roll_val, count in dist_dict.items():
                cursor.execute("""
                    INSERT INTO silver_distributions (runid, category, rollvalue, occurrencecount)
                    VALUES (?, ?, ?, ?)
                """, run_id, category_name, int(roll_val), count)

        # process each phase distribution
        insert_distributions("hit", raw_data.get("hit_distribution", {}))
        insert_distributions("wound", raw_data.get("wound_distribution", {}))
        insert_distributions("save", raw_data.get("save_distribution", {}))
        insert_distributions("damage", raw_data.get("damage_distribution", {}))
        insert_distributions("killed", raw_data.get("killed_distribution", {}))
            
        # commit transaction to save all changes at once
        conn.commit()
        
    except Exception as e:
        # rollback undoes all inserts if any single step fails
        if conn:
            conn.rollback()
        raise e
        
    finally:
        # always close connection to prevent memory leaks
        if cursor:
            cursor.close()
        if conn:
            conn.close()