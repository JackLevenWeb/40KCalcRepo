CREATE TABLE [dbo].[gold_dim_target_modifiers]
(
    [target_modifier_sk] int IDENTITY(1,1) PRIMARY KEY,
    [target_def_minus_hit] bit NOT NULL,
    [target_def_minus_wound] bit NOT NULL,
    [target_def_minus_wound_str] bit NOT NULL,
    [target_def_cover] bit NOT NULL,
    [target_def_plus_one_save] bit NOT NULL
);