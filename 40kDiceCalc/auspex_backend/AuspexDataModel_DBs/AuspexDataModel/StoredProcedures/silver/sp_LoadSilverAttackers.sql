CREATE PROCEDURE [dbo].[sp_LoadSilverAttackers]
AS
BEGIN
  SET NOCOUNT ON;

  -- 2. insert new attackers into silver_attackers
  INSERT INTO [dbo].[silver_attackers]
    (
    runid, unit_id, attackername, attackerfaction, models, attacks,
    bs_ws, strength, ap, damage, unit_count, is_leader, attach_target_id, granted_keyword,
    mod_lethal, mod_devastating, mod_torrent, mod_twin_linked, mod_blast, mod_cleave, mod_lance,
    mod_sustained, mod_melta, mod_rapid_fire, mod_anti, mod_hit_mod, mod_wound_mod,
    mod_crit_hit_threshold, mod_crit_wound_threshold, mod_reroll_hits, mod_reroll_wounds, mod_fish_for_crits
    )
  SELECT
    SessionData.run_id,
    Attacker.unit_id,

    -- server side data cleaning: strip out the ? artifact from the ui arrow
    LTRIM(RTRIM(REPLACE(Attacker.name, '?', ''))),

    Attacker.faction,
    Attacker.models,
    Attacker.attacks,
    Attacker.bs_ws,
    Attacker.strength,
    Attacker.ap,
    Attacker.damage,
    Attacker.unit_count,
    Attacker.is_leader,
    Attacker.attach_target_id,
    Attacker.granted_keyword,
    Mods.lethal,
    Mods.devastating,
    Mods.torrent,
    Mods.twin_linked,
    Mods.blast,
    Mods.cleave,
    Mods.lance,
    Mods.sustained,
    Mods.melta,
    Mods.rapid_fire,
    Mods.anti,
    Mods.hit_mod,
    Mods.wound_mod,
    Mods.crit_hit_threshold,
    Mods.crit_wound_threshold,
    Mods.reroll_hits,
    Mods.reroll_wounds,
    Mods.fish_for_crits
  FROM [dbo].[bronze_rawtelemetry] b
    CROSS APPLY OPENJSON(b.jsonpayload, '$.session_data') WITH (
        run_id uniqueidentifier '$.run_id'
    ) AS SessionData
    CROSS APPLY OPENJSON(b.jsonpayload, '$.simulation_parameters.attacker_units') WITH (
        unit_id varchar(50) '$.unit_id',
        name varchar(100) '$.name',
        faction varchar(50) '$.faction',
        models int '$.models',
        attacks varchar(50) '$.attacks',
        bs_ws varchar(10) '$.bs_ws',
        strength int '$.strength',
        ap int '$.ap',
        damage varchar(50) '$.damage',
        unit_count int '$.unit_count',
        is_leader bit '$.is_leader',
        attach_target_id varchar(50) '$.attach_target_id',
        granted_keyword varchar(50) '$.granted_keyword',
        modifiers nvarchar(max) '$.modifiers' AS JSON
    ) AS Attacker
    CROSS APPLY OPENJSON(Attacker.modifiers) WITH (
        lethal bit '$.lethal',
        devastating bit '$.devastating',
        torrent bit '$.torrent',
        twin_linked bit '$.twin_linked',
        blast bit '$.blast',
        cleave bit '$.cleave',
        lance bit '$.lance',
        sustained int '$.sustained',
        melta int '$.melta',
        rapid_fire int '$.rapid_fire',
        anti int '$.anti',
        hit_mod int '$.hit_mod',
        wound_mod int '$.wound_mod',
        crit_hit_threshold int '$.crit_hit_threshold',
        crit_wound_threshold int '$.crit_wound_threshold',
        reroll_hits varchar(20) '$.reroll_hits',
        reroll_wounds varchar(20) '$.reroll_wounds',
        fish_for_crits bit '$.fish_for_crits'
    ) AS Mods
    LEFT JOIN [dbo].[silver_attackers] existing_a
    ON existing_a.runid = SessionData.run_id
      AND existing_a.unit_id = Attacker.unit_id
  WHERE existing_a.runid IS NULL;

END;