CREATE PROCEDURE [dbo].[sp_LoadGoldDimTargetBase] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[gold_dim_target_base] (
        targetname,
        targetfaction,
        targetwounds,
        targettoughness,
        targetsave
    )
SELECT
    DISTINCT ss.targetname,
    ss.targetfaction,
    ss.targetwounds,
    ss.targettoughness,
    ss.targetsave
FROM
    [dbo].[silver_simulations] AS ss
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            [dbo].[gold_dim_target_base] AS tb
        WHERE
            tb.targetname = ss.targetname
            AND tb.targetfaction = ss.targetfaction
            AND tb.targetwounds = ss.targetwounds
            AND tb.targettoughness = ss.targettoughness
            AND tb.targetsave = ss.targetsave
    );

END;

GO