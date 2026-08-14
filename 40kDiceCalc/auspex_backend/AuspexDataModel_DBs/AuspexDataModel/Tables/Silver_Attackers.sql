-- --- silver_attackers schema ---
create table [dbo].[silver_attackers]
(
    [attackerid] int identity(1,1) primary key,
    [runid] uniqueidentifier,
    [attackername] varchar(100),
    [attackerfaction] varchar(50),
    [models] int,
    [attacks] varchar(50),

    -- base stats
    [bs_ws] varchar(10),
    [strength] int,
    [ap] int,
    [damage] varchar(50),
    [unit_count] int,
    [is_leader] bit,
    [attach_target] varchar(100),
    [granted_keyword] varchar(50),

    -- modifiers and rules
    [mod_lethal] bit,
    [mod_devastating] bit,
    [mod_torrent] bit,
    [mod_twin_linked] bit,
    [mod_blast] bit,
    [mod_cleave] bit,
    [mod_lance] bit,
    [mod_sustained] int,
    [mod_melta] int,
    [mod_rapid_fire] int,
    [mod_anti] int,
    [mod_hit_mod] int,
    [mod_wound_mod] int,
    [mod_crit_hit_threshold] int,
    [mod_crit_wound_threshold] int,
    [mod_reroll_hits] varchar(20),
    [mod_reroll_wounds] varchar(20),
    [mod_fish_for_crits] bit,

    -- foreign key relationship
    constraint fk_silverattackers_runid foreign key ([runid]) references [dbo].[silver_simulations]([runid])
)