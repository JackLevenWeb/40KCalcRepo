CREATE PROCEDURE [dbo].[sp_LoadGoldDimAttackerProfile] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[gold_dim_attacker_profile] (
        unitname,
        faction,
        models,
        attacks,
        bs_ws,
        strength,
        ap,
        damage,
        unit_count
    )
SELECT
    DISTINCT sa.attackername,
    sa.attackerfaction,
    sa.models,
    sa.attacks,
    sa.bs_ws,
    sa.strength,
    sa.ap,
    sa.damage,
    sa.unit_count
FROM
    [dbo].[silver_attackers] AS sa
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            [dbo].[gold_dim_attacker_profile] AS ap
        WHERE
            sa.attackername = ap.unitname
            AND sa.attackerfaction = ap.faction
            AND sa.models = ap.models
            AND sa.attacks = ap.attacks
            AND sa.bs_ws = ap.bs_ws
            AND sa.strength = ap.strength
            AND sa.ap = ap.ap
            AND sa.damage = ap.damage
            AND sa.unit_count = ap.unit_count
    );

END;

GO