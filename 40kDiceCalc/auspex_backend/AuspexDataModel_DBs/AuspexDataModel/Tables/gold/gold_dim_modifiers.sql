create table [dbo].[gold_dim_modifiers]
(
    [modifier_sk] int identity(1,1) primary key,
    [mod_lethal] bit not null,
    [mod_devastating] bit not null,
    [mod_torrent] bit not null,
    [mod_twin_linked] bit not null,
    [mod_blast] bit not null,
    [mod_cleave] bit not null,
    [mod_lance] bit not null,
    [mod_sustained] int not null,
    [mod_melta] int not null,
    [mod_rapid_fire] int not null,
    [mod_anti] int not null,
    [mod_hit_mod] int not null,
    [mod_wound_mod] int not null,
    [mod_crit_hit_threshold] int not null,
    [mod_crit_wound_threshold] int not null,
    [mod_reroll_hits] varchar(20) not null,
    [mod_reroll_wounds] varchar(20) not null,
    [mod_fish_for_crits] bit not null
);