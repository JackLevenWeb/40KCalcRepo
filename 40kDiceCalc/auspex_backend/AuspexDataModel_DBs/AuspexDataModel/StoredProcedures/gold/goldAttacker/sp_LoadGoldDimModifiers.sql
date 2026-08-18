CREATE PROCEDURE [dbo].[sp_LoadGoldDimModifiers] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[gold_dim_modifiers] (
        mod_lethal,
        mod_devastating,
        mod_torrent,
        mod_twin_linked,
        mod_blast,
        mod_cleave,
        mod_lance,
        mod_sustained,
        mod_melta,
        mod_rapid_fire,
        mod_anti,
        mod_hit_mod,
        mod_wound_mod,
        mod_crit_hit_threshold,
        mod_crit_wound_threshold,
        mod_reroll_hits,
        mod_reroll_wounds,
        mod_fish_for_crits
    )
SELECT
    DISTINCT sa.mod_lethal,
    sa.mod_devastating,
    sa.mod_torrent,
    sa.mod_twin_linked,
    sa.mod_blast,
    sa.mod_cleave,
    sa.mod_lance,
    sa.mod_sustained,
    sa.mod_melta,
    sa.mod_rapid_fire,
    sa.mod_anti,
    sa.mod_hit_mod,
    sa.mod_wound_mod,
    sa.mod_crit_hit_threshold,
    sa.mod_crit_wound_threshold,
    sa.mod_reroll_hits,
    sa.mod_reroll_wounds,
    sa.mod_fish_for_crits
FROM
    [dbo].[silver_attackers] AS sa
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            [dbo].[gold_dim_modifiers] AS m
        WHERE
            m.mod_lethal = sa.mod_lethal
            AND m.mod_devastating = sa.mod_devastating
            AND m.mod_torrent = sa.mod_torrent
            AND m.mod_twin_linked = sa.mod_twin_linked
            AND m.mod_blast = sa.mod_blast
            AND m.mod_cleave = sa.mod_cleave
            AND m.mod_lance = sa.mod_lance
            AND m.mod_sustained = sa.mod_sustained
            AND m.mod_melta = sa.mod_melta
            AND m.mod_rapid_fire = sa.mod_rapid_fire
            AND m.mod_anti = sa.mod_anti
            AND m.mod_hit_mod = sa.mod_hit_mod
            AND m.mod_wound_mod = sa.mod_wound_mod
            AND m.mod_crit_hit_threshold = sa.mod_crit_hit_threshold
            AND m.mod_crit_wound_threshold = sa.mod_crit_wound_threshold
            AND m.mod_reroll_hits = sa.mod_reroll_hits
            AND m.mod_reroll_wounds = sa.mod_reroll_wounds
            AND m.mod_fish_for_crits = sa.mod_fish_for_crits
    );

END;

GO