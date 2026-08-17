CREATE TABLE [dbo].[gold_dim_modifiers] (
    [modifier_sk] INT IDENTITY(1, 1) PRIMARY KEY,
    [mod_lethal] BIT NOT NULL,
    [mod_devastating] BIT NOT NULL,
    [mod_torrent] BIT NOT NULL,
    [mod_twin_linked] BIT NOT NULL,
    [mod_blast] BIT NOT NULL,
    [mod_cleave] BIT NOT NULL,
    [mod_lance] BIT NOT NULL,
    [mod_sustained] INT NOT NULL,
    [mod_melta] INT NOT NULL,
    [mod_rapid_fire] INT NOT NULL,
    [mod_anti] INT NOT NULL,
    [mod_hit_mod] INT NOT NULL, 
    [mod_wound_mod] INT NOT NULL,
    [mod_crit_hit_threshold] INT NOT NULL,
    [mod_crit_wound_threshold] INT NOT NULL,
    [mod_reroll_hits] VARCHAR(20) NOT NULL,
    [mod_reroll_wounds] VARCHAR(20) NOT NULL,
    [mod_fish_for_crits] BIT NOT NULL
);

GO