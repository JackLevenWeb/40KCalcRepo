CREATE PROCEDURE [dbo].[sp_LoadGoldDimTargetModifiers] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[gold_dim_target_modifiers] (
        target_def_minus_hit,
        target_def_minus_wound,
        target_def_minus_wound_str,
        target_def_cover,
        target_def_plus_one_save
    )
SELECT
    DISTINCT ss.target_def_minus_hit,
    ss.target_def_minus_wound,
    ss.target_def_minus_wound_str,
    ss.target_def_cover,
    ss.target_def_plus_one_save
FROM
    [dbo].[silver_simulations] AS ss
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            [dbo].[gold_dim_target_modifiers] AS tm
        WHERE
            tm.target_def_minus_hit = ss.target_def_minus_hit
            AND tm.target_def_minus_wound = ss.target_def_minus_wound
            AND tm.target_def_minus_wound_str = ss.target_def_minus_wound_str
            AND tm.target_def_cover = ss.target_def_cover
            AND tm.target_def_plus_one_save = ss.target_def_plus_one_save
    );

END;

GO