create table [dbo].[gold_dim_target_profile]
(
    [target_sk] int identity(1,1) primary key,
    [targetname] varchar(100) not null,
    [targetfaction] varchar(50) not null,
    [targetwounds] int not null,
    [targettoughness] int not null,
    [targetsave] int not null,
    [target_def_minus_hit] bit not null,
    [target_def_minus_wound] bit not null,
    [target_def_minus_wound_str] bit not null,
    [target_def_cover] bit not null,
    [target_def_plus_one_save] bit not null
);