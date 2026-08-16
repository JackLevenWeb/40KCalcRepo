create table [dbo].[gold_dim_target_modifiers]
(
    [target_modifier_sk] int identity(1,1) primary key,
    [target_def_minus_hit] bit not null,
    [target_def_minus_wound] bit not null,
    [target_def_minus_wound_str] bit not null,
    [target_def_cover] bit not null,
    [target_def_plus_one_save] bit not null
);