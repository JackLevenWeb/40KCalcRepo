import pyodbc
import uuid

def process_telemetry_payload(conn_string, payload):
    # this acts exactly like a javascript try catch block
    conn = None
    cursor = None
    try:
        # open database connection
        conn = pyodbc.connect(conn_string)
        cursor = conn.cursor()
        
        # extract data from the json object dictionary
        session = payload.get("session_data", {})
        run_id = session.get("run_id")
        
        # 1 insert parent record first to satisfy foreign key rules
        # this must happen before attackers or distributions are inserted
        cursor.execute("""
            INSERT INTO silver_simulations (runid, batchid, userid)
            VALUES (?, ?, ?)
        """, run_id, session.get("batch_id"), session.get("user_id"))
        
        # 2 loop through attackers array and insert child records
        attackers = payload.get("simulation_parameters", {}).get("attacker_units", [])
        
        for attacker in attackers:
            cursor.execute("""
                INSERT INTO silver_attackers (runid, attackername, models, attacks)
                VALUES (?, ?, ?, ?)
            """, run_id, attacker.get("name"), attacker.get("models"), attacker.get("attacks"))
            
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