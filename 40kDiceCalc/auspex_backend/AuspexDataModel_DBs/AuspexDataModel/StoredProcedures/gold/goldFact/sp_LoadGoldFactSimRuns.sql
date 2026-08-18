CREATE PROCEDURE [dbo].[sp_LoadGoldFactSimRuns] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[gold_fact_sim_runs] (
        runid,
        audit_sk,
        sim_config_sk,
        target_base_sk,
        target_modifier_sk,
        attacks_rolled,
        hits_raw_successes,
        hits_bonus_hits,
        hits_auto_wounds,
        wounds_raw_successes,
        wounds_dev_wounds,
        wounds_normal_wounds,
        saves_failed_count,
        damage_total,
        damage_models_killed,
        damage_wasted,
        final_health
    )
SELECT
    ss.runid,
    aa.audit_sk,
    sc.sim_config_sk,
    tb.target_base_sk,
    tm.target_modifier_sk,
    ss.attacks_rolled,
    ss.hits_raw_successes,
    ss.hits_bonus_hits,
    ss.hits_auto_wounds,
    ss.wounds_raw_successes,
    ss.wounds_dev_wounds,
    ss.wounds_normal_wounds,
    ss.saves_failed_count,
    ss.damage_total,
    ss.damage_models_killed,
    ss.damage_wasted,
    ss.final_health
FROM
    [dbo].[silver_simulations] AS ss
    INNER JOIN [dbo].[gold_dim_target_base] tb ON ss.targetname = tb.targetname
    AND ss.targetfaction = tb.targetfaction
    AND ss.targetwounds = tb.targetwounds
    AND ss.targettoughness = tb.targettoughness
    AND ss.targetsave = tb.targetsave
    INNER JOIN [dbo].[gold_dim_audit] AS aa ON ss.runid = aa.runid
    INNER JOIN [dbo].[gold_dim_target_modifiers] tm ON ss.target_def_minus_hit = tm.target_def_minus_hit
    AND ss.target_def_minus_wound = tm.target_def_minus_wound
    AND ss.target_def_minus_wound_str = tm.target_def_minus_wound_str
    AND ss.target_def_cover = tm.target_def_cover
    AND ss.target_def_plus_one_save = tm.target_def_plus_one_save
    INNER JOIN [dbo].[gold_dim_sim_config] sc ON ss.simulationtype = sc.simulationtype
    AND ss.totaliterations = sc.totaliterations -- prevent duplicate inserts
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            [dbo].[gold_fact_sim_runs] AS f
        WHERE
            f.runid = ss.runid
    );

END;

GO