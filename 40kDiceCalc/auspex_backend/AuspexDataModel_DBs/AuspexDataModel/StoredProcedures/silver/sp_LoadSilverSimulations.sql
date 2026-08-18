CREATE PROCEDURE [dbo].[sp_LoadSilverSimulations]
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. insert new simulations into silver_simulations
    INSERT INTO [dbo].[silver_simulations]
        (
        runid, batchid, userid, [timestamp], appversion,
        executiontimems, deviceconcurrency, simulationtype, totaliterations,
        targetname, targetfaction, targetwounds, targettoughness, targetsave,
        target_def_minus_hit, target_def_minus_wound, target_def_minus_wound_str,
        target_def_cover, target_def_plus_one_save,
        attacks_rolled, hits_raw_successes, hits_bonus_hits, hits_auto_wounds,
        wounds_raw_successes, wounds_dev_wounds, wounds_normal_wounds,
        saves_failed_count, damage_total, damage_models_killed, damage_wasted, final_health
        )
    SELECT
        SessionData.run_id,
        SessionData.batch_id,
        SessionData.user_id,
        SessionData.timeStamp,
        SessionData.app_version,
        Perf.execution_time_ms,
        Perf.device_concurrency,
        Params.simulation_type,
        Params.total_iterations,
        LTRIM(RTRIM(REPLACE(TargetUnit.name, '?', ''))),
        TargetUnit.faction,
        TargetUnit.wounds,
        TargetUnit.toughness,
        TargetUnit.targetsave,
        TargetUnit.def_minus_hit,
        TargetUnit.def_minus_wound,
        TargetUnit.def_minus_wound_str,
        TargetUnit.def_cover,
        TargetUnit.def_plus_one_save,
        Agg.attacks_rolled,
        Agg.hits_raw_successes,
        Agg.hits_bonus_hits,
        Agg.hits_auto_wounds,
        Agg.wounds_raw_successes,
        Agg.wounds_dev_wounds,
        Agg.wounds_normal_wounds,
        Agg.saves_failed_count,
        Agg.damage_total,
        Agg.damage_models_killed,
        Agg.damage_wasted,
        Agg.final_health
    FROM [dbo].[bronze_rawtelemetry] b
    CROSS APPLY OPENJSON(b.jsonpayload, '$.session_data') WITH (
        run_id uniqueidentifier '$.run_id',
        batch_id varchar(50) '$.batch_id',
        user_id varchar(100) '$.user_id',
        timeStamp varchar(50) '$.timeStamp',
        app_version varchar(50) '$.app_version'
    ) AS SessionData
    CROSS APPLY OPENJSON(b.jsonpayload, '$.performance_metrics') WITH (
        execution_time_ms float '$.execution_time_ms',
        device_concurrency int '$.device_concurrency'
    ) AS Perf
    CROSS APPLY OPENJSON(b.jsonpayload, '$.simulation_parameters') WITH (
        simulation_type varchar(50) '$.simulation_type',
        total_iterations int '$.total_iterations'
    ) AS Params
    CROSS APPLY OPENJSON(b.jsonpayload, '$.simulation_parameters.target_unit') WITH (
        name varchar(100) '$.name',
        faction varchar(50) '$.faction',
        wounds int '$.wounds',
        toughness int '$.toughness',
        targetsave int '$.save',
        def_minus_hit bit '$.def_minus_hit',
        def_minus_wound bit '$.def_minus_wound',
        def_minus_wound_str bit '$.def_minus_wound_str',
        def_cover bit '$.def_cover',
        def_plus_one_save bit '$.def_plus_one_save'
    ) AS TargetUnit
    CROSS APPLY OPENJSON(b.jsonpayload, '$.phase_aggregates') WITH (
        attacks_rolled float '$.attacks_rolled',
        hits_raw_successes float '$.hits_raw_successes',
        hits_bonus_hits float '$.hits_bonus_hits',
        hits_auto_wounds float '$.hits_auto_wounds',
        wounds_raw_successes float '$.wounds_raw_successes',
        wounds_dev_wounds float '$.wounds_dev_wounds',
        wounds_normal_wounds float '$.wounds_normal_wounds',
        saves_failed_count float '$.saves_failed_count',
        damage_total float '$.damage_total',
        damage_models_killed float '$.damage_models_killed',
        damage_wasted float '$.damage_wasted',
        final_health float '$.final_health'
    ) AS Agg
        LEFT JOIN [dbo].[silver_simulations] existing_s
        ON existing_s.runid = SessionData.run_id
    WHERE existing_s.runid IS NULL;

END;