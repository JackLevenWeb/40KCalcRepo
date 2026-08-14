-- silver_simulations schema
create table [dbo].[silver_simulations]
(
    [runid] uniqueidentifier primary key,
    [batchid] varchar(50) not null,
    [userid] varchar(100),
    [timestamp] varchar(50),
    [appversion] varchar(50),
    [executiontimems] float,
    [deviceconcurrency] int,
    [simulationtype] varchar(50),
    [totaliterations] int,
    [targetname] varchar(100),
    [targetfaction] varchar(50),
    [targetwounds] int,
    [targettoughness] int,
    [targetsave] int,

    -- target defensives
    [target_def_minus_hit] bit,
    [target_def_minus_wound] bit,
    [target_def_minus_wound_str] bit,
    [target_def_cover] bit,
    [target_def_plus_one_save] bit,

    -- phase aggregates
    [hits_raw_successes] float,
    [hits_bonus_hits] float,
    [hits_auto_wounds] float,
    [wounds_raw_successes] float,
    [wounds_dev_wounds] float,
    [wounds_normal_wounds] float,
    [saves_failed_count] float,
    [damage_total] float,
    [damage_models_killed] float,
    [damage_wasted] float,
    [final_health] float
)