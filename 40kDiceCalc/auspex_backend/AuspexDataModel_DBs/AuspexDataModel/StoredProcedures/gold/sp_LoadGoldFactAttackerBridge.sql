CREATE PROCEDURE dbo.sp_LoadGoldFactAttackerBridge
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.gold_fact_attacker_bridge (
        runid,
        attacker_sk,
        attacker_status_sk,
        modifier_sk
    )
    SELECT 
        sa.runid,
        ap.attacker_sk,
        st.attacker_status_sk,
        m.modifier_sk
    FROM dbo.silver_attackers AS sa
    
   
    INNER JOIN dbo.gold_dim_attacker_profile ap
        ON sa.attackername = ap.unitname
       AND sa.attackerfaction = ap.faction
       AND sa.models = ap.models
       AND sa.attacks = ap.attacks
       AND sa.bs_ws = ap.bs_ws
       AND sa.strength = ap.strength
       AND sa.ap = ap.ap
       AND sa.damage = ap.damage
       AND sa.unit_count = ap.unit_count
       
    
    INNER JOIN dbo.gold_dim_attacker_status st
        ON sa.is_leader = st.is_leader
       AND ISNULL(sa.granted_keyword, '') = ISNULL(st.granted_keyword, '')
       
   
    INNER JOIN dbo.gold_dim_modifiers m
        ON sa.mod_lethal = m.mod_lethal
       AND sa.mod_devastating = m.mod_devastating
       AND sa.mod_torrent = m.mod_torrent
       AND sa.mod_twin_linked = m.mod_twin_linked
       AND sa.mod_blast = m.mod_blast
       AND sa.mod_cleave = m.mod_cleave
       AND sa.mod_lance = m.mod_lance
       AND sa.mod_sustained = m.mod_sustained
       AND sa.mod_melta = m.mod_melta
       AND sa.mod_rapid_fire = m.mod_rapid_fire
       AND sa.mod_anti = m.mod_anti
       AND sa.mod_hit_mod = m.mod_hit_mod
       AND sa.mod_wound_mod = m.mod_wound_mod
       AND sa.mod_crit_hit_threshold = m.mod_crit_hit_threshold
       AND sa.mod_crit_wound_threshold = m.mod_crit_wound_threshold
       AND sa.mod_reroll_hits = m.mod_reroll_hits
       AND sa.mod_reroll_wounds = m.mod_reroll_wounds
       AND sa.mod_fish_for_crits = m.mod_fish_for_crits

    -- pevent inserting the same attacker for the same run
    WHERE NOT EXISTS (
        SELECT 1 
        FROM dbo.gold_fact_attacker_bridge AS b
        WHERE b.runid = sa.runid
          AND b.attacker_sk = ap.attacker_sk
          AND b.attacker_status_sk = st.attacker_status_sk
          AND b.modifier_sk = m.modifier_sk
    );
END;
GO