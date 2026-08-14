
import pyodbc
import json

#  defensive conversion helpers 
def safe_str(val, max_len=50, default="Unknown"):
    if val is None or str(val).strip() == "":
        res = default
    else:
        raw_str = str(val).strip()
        # encode to ascii, ignoring unknown characters, then decode back to a string
        clean_str = raw_str.encode('ascii', 'ignore').decode('ascii')
        res = clean_str if clean_str != "" else default
    return res[:max_len]

#  main pipeline service 
def process_telemetry_payload(conn_string, payload):
    conn = None
    cursor = None
    
    try:
        conn = pyodbc.connect(conn_string)
        cursor = conn.cursor()
        
        # extract high-level session data for tracking
        session = payload.get("session_data", {})
        batch_id = safe_str(session.get("batch_id"), 50, "BATCH-000")
        
        # convert the entire payload back into a safe json string
        json_string = json.dumps(payload)
        
        # extract and load directly into the bronze layer
        cursor.execute("""
            INSERT INTO bronze_rawtelemetry (batchid, jsonpayload)
            VALUES (?, ?)
        """, batch_id, json_string)
            
        conn.commit()
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()




#move to azure comp approach - keeping previous code to reference for later steps >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
# import pyodbc
# import uuid
# import json

# #  defensive conversion helpers 

# def safe_uuid(val):
#     try:
#         return str(uuid.UUID(str(val)))
#     except (ValueError, TypeError, AttributeError):
#         return str(uuid.uuid4())

# def safe_int(val, default=0, allow_null=False):
#     if val is None or val == "":
#         return None if allow_null else default
#     try:
#         return int(val)
#     except (ValueError, TypeError):
#         return None if allow_null else default

# def safe_float(val, default=0.0):
#     if val is None or val == "":
#         return default
#     try:
#         return float(val)
#     except (ValueError, TypeError):
#         return default

# def safe_str(val, max_len=50, default="Unknown"):
#     if val is None or str(val).strip() == "":
#         res = default
#     else:
#         raw_str = str(val).strip()
#         clean_str = raw_str.encode('ascii', 'ignore').decode('ascii')
#         res = clean_str if clean_str != "" else default
#     return res[:max_len]

# def safe_bool(val):
#     if val in [True, 1, 'true', 'True', '1']:
#         return 1
#     return 0

# #  main pipeline service 

# def process_telemetry_payload(conn_string, payload):
#     conn = None
#     cursor = None
    
#     try:
#         conn = pyodbc.connect(conn_string)
#         cursor = conn.cursor()
        
#         session = payload.get("session_data", {})
#         perf = payload.get("performance_metrics", {})
#         params = payload.get("simulation_parameters", {})
#         target = params.get("target_unit", {})
#         aggregates = payload.get("phase_aggregates", {})
#         raw_data = payload.get("raw_data", {})
        
#         run_id = safe_uuid(session.get("run_id"))
#         batch_id = safe_str(session.get("batch_id"), 50, "BATCH-000")
        
#         # insert raw json payload into bronze layer
#         json_string = json.dumps(payload)
        
#         cursor.execute("""
#             INSERT INTO bronze_rawtelemetry (batchid, jsonpayload)
#             VALUES (?, ?)
#         """, batch_id, json_string)
        
#         # parse silver_simulations data
#         cursor.execute("""
#             INSERT INTO silver_simulations (
#                 runid, batchid, userid, timestamp, appversion,
#                 executiontimems, deviceconcurrency, simulationtype, totaliterations,
#                 targetname, targetfaction, targetwounds, targettoughness, targetsave,
#                 target_def_minus_hit, target_def_minus_wound, target_def_minus_wound_str, 
#                 target_def_cover, target_def_plus_one_save,
#                 hits_raw_successes, hits_bonus_hits, hits_auto_wounds,
#                 wounds_raw_successes, wounds_dev_wounds, wounds_normal_wounds,
#                 saves_failed_count, damage_total, damage_models_killed, damage_wasted, final_health
#             )
#             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#         """, 
#             run_id, 
#             safe_str(session.get("batch_id"), 50, "BATCH-000"), 
#             safe_str(session.get("user_id"), 100, "anonymous"), 
#             safe_str(session.get("timeStamp"), 50, "1970-01-01T00:00:00Z"), 
#             safe_str(session.get("app_version"), 50, "1.0.0"),
#             safe_float(perf.get("execution_time_ms")), 
#             safe_int(perf.get("device_concurrency"), 1), 
#             safe_str(params.get("simulation_type"), 50, "standard"), 
#             safe_int(params.get("total_iterations"), 1000),
#             safe_str(target.get("name"), 100, "Target Unit"), 
#             safe_str(target.get("faction"), 50, "Unknown"), 
#             safe_int(target.get("wounds"), 1), 
#             safe_int(target.get("toughness"), 4), 
#             safe_int(target.get("save"), 3),
#             safe_bool(target.get("def_minus_hit")),
#             safe_bool(target.get("def_minus_wound")),
#             safe_bool(target.get("def_minus_wound_str")),
#             safe_bool(target.get("def_cover")),
#             safe_bool(target.get("def_plus_one_save")),
#             safe_float(aggregates.get("hits_raw_successes")),
#             safe_float(aggregates.get("hits_bonus_hits")),
#             safe_float(aggregates.get("hits_auto_wounds")),
#             safe_float(aggregates.get("wounds_raw_successes")),
#             safe_float(aggregates.get("wounds_dev_wounds")),
#             safe_float(aggregates.get("wounds_normal_wounds")),
#             safe_float(aggregates.get("saves_failed_count")),
#             safe_float(aggregates.get("damage_total")),
#             safe_float(aggregates.get("damage_models_killed")),
#             safe_float(aggregates.get("damage_wasted")),
#             safe_float(aggregates.get("final_health"))
#         )
        
     
#         # parse silver_attackers data
#         attackers = params.get("attacker_units", [])
#         for att in attackers:
#             mods = att.get("modifiers", {})
            
#             cursor.execute("""
#                 INSERT INTO silver_attackers (
#                     runid, unit_id, attackername, attackerfaction, models, attacks,
#                     bs_ws, strength, ap, damage, unit_count, is_leader, attach_target_id, granted_keyword,
#                     mod_lethal, mod_devastating, mod_torrent, mod_twin_linked, mod_blast, mod_cleave, mod_lance,
#                     mod_sustained, mod_melta, mod_rapid_fire, mod_anti, mod_hit_mod, mod_wound_mod,
#                     mod_crit_hit_threshold, mod_crit_wound_threshold, mod_reroll_hits, mod_reroll_wounds, mod_fish_for_crits
#                 )
#                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
#             """, 
#                 run_id, 
#                 safe_str(att.get("unit_id"), 50, ""),
#                 safe_str(att.get("name"), 100, "Attacker Unit"), 
#                 safe_str(att.get("faction"), 50, "Unknown"), 
#                 safe_int(att.get("models"), 1), 
#                 safe_str(att.get("attacks"), 50, "1"),
#                 safe_str(att.get("bs_ws"), 10, "3"),
#                 safe_int(att.get("strength"), 4),
#                 safe_int(att.get("ap"), 0),
#                 safe_str(att.get("damage"), 50, "1"),
#                 safe_int(att.get("unit_count"), 1),
#                 safe_bool(att.get("is_leader")),
#                 safe_str(att.get("attach_target_id"), 50, ""),
#                 safe_str(att.get("granted_keyword"), 50, "none"),
#                 safe_bool(mods.get("lethal")),
#                 safe_bool(mods.get("devastating")),
#                 safe_bool(mods.get("torrent")),
#                 safe_bool(mods.get("twin_linked")),
#                 safe_bool(mods.get("blast")),
#                 safe_bool(mods.get("cleave")),
#                 safe_bool(mods.get("lance")),
#                 safe_int(mods.get("sustained"), 0),
#                 safe_int(mods.get("melta"), 0),
#                 safe_int(mods.get("rapid_fire"), 0),
#                 safe_int(mods.get("anti"), 0),
#                 safe_int(mods.get("hit_mod"), 0),
#                 safe_int(mods.get("wound_mod"), 0),
#                 safe_int(mods.get("crit_hit_threshold"), 6),
#                 safe_int(mods.get("crit_wound_threshold"), 6),
#                 safe_str(mods.get("reroll_hits"), 20, "none"),
#                 safe_str(mods.get("reroll_wounds"), 20, "none"),
#                 safe_bool(mods.get("fish_for_crits"))
#             )
            
#         #parse silver_distributions data 
#         def insert_distributions(category_name, dist_dict):
#             if not isinstance(dist_dict, dict):
#                 return
#             for roll_val, count in dist_dict.items():
#                 cursor.execute("""
#                     INSERT INTO silver_distributions (runid, category, rollvalue, occurrencecount)
#                     VALUES (?, ?, ?, ?)
#                 """, run_id, category_name, safe_int(roll_val, 0), safe_int(count, 0))

#         insert_distributions("hit", raw_data.get("hit_distribution", {}))
#         insert_distributions("wound", raw_data.get("wound_distribution", {}))
#         insert_distributions("save", raw_data.get("save_distribution", {}))
#         insert_distributions("damage", raw_data.get("damage_distribution", {}))
#         insert_distributions("killed", raw_data.get("killed_distribution", {}))
            
#         conn.commit()
        
#     except Exception as e:
#         if conn:
#             conn.rollback()
#         raise e
        
#     finally:
#         if cursor:
#             cursor.close()
#         if conn:
#             conn.close()