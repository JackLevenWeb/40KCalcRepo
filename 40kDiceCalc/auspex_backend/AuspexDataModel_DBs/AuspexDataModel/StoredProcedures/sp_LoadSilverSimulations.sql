create procedure [dbo].[sp_LoadSilverSimulations]
as
begin
    set nocount on;

    -- 1. insert new simulations into silver_simulations
    insert into dbo.silver_simulations
        (
        runid, batchid, userid, timestamp, appversion,
        executiontimems, deviceconcurrency, simulationtype, totaliterations,
        targetname, targetfaction, targetwounds, targettoughness, targetsave,
        target_def_minus_hit, target_def_minus_wound, target_def_minus_wound_str,
        target_def_cover, target_def_plus_one_save,
        hits_raw_successes, hits_bonus_hits, hits_auto_wounds,
        wounds_raw_successes, wounds_dev_wounds, wounds_normal_wounds,
        saves_failed_count, damage_total, damage_models_killed, damage_wasted, final_health
        )
    select
        SessionData.run_id,
        SessionData.batch_id,
        SessionData.user_id,
        SessionData.timeStamp,
        SessionData.app_version,
        Perf.execution_time_ms,
        Perf.device_concurrency,
        Params.simulation_type,
        Params.total_iterations,
        ltrim(rtrim(replace(TargetUnit.name, '?', ''))),
        TargetUnit.faction,
        TargetUnit.wounds,
        TargetUnit.toughness,
        TargetUnit.targetsave,
        TargetUnit.def_minus_hit,
        TargetUnit.def_minus_wound,
        TargetUnit.def_minus_wound_str,
        TargetUnit.def_cover,
        TargetUnit.def_plus_one_save,
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
    from dbo.bronze_rawtelemetry b
    cross apply openjson(b.jsonpayload, '$.session_data') with (
        run_id uniqueidentifier '$.run_id',
        batch_id varchar(50) '$.batch_id',
        user_id varchar(100) '$.user_id',
        timeStamp varchar(50) '$.timeStamp',
        app_version varchar(50) '$.app_version'
    ) as SessionData
    cross apply openjson(b.jsonpayload, '$.performance_metrics') with (
        execution_time_ms float '$.execution_time_ms',
        device_concurrency int '$.device_concurrency'
    ) as Perf
    cross apply openjson(b.jsonpayload, '$.simulation_parameters') with (
        simulation_type varchar(50) '$.simulation_type',
        total_iterations int '$.total_iterations'
    ) as Params
    cross apply openjson(b.jsonpayload, '$.simulation_parameters.target_unit') with (
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
    ) as TargetUnit
    cross apply openjson(b.jsonpayload, '$.phase_aggregates') with (
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
    ) as Agg
        left join dbo.silver_simulations existing_s
        on existing_s.runid = SessionData.run_id
    where existing_s.runid is null;

end;