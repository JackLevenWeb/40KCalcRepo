CREATE TABLE [dbo].[gold_dim_modifiers] (
    [modifier_sk] int IDENTITY(1, 1) PRIMARY KEY,
    [mod_lethal] bit NOT NULL,
    [mod_devastating] bit NOT NULL,
    [mod_torrent] bit NOT NULL,
    [mod_twin_linked] bit NOT NULL,
    [mod_blast] bit NOT NULL,
    [mod_cleave] bit NOT NULL,
    [mod_lance] bit NOT NULL,
    [mod_sustained] int NOT NULL,
    [mod_melta] int NOT NULL,
    [mod_rapid_fire] int NOT NULL,
    [mod_anti] int NOT NULL,
    [mod_hit_mod] int NOT NULL, 
    [mod_wound_mod] int NOT NULL,
    [mod_crit_hit_threshold] int NOT NULL,
    [mod_crit_wound_threshold] int NOT NULL,
    [mod_reroll_hits] varchar(20) NOT NULL,
    [mod_reroll_wounds] varchar(20) NOT NULL,
    [mod_fish_for_crits] bit NOT NULL
);

GO