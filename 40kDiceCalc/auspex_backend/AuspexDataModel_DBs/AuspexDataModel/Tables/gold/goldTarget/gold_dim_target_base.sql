CREATE TABLE [dbo].[gold_dim_target_base]
(
    [target_base_sk] int IDENTITY(1,1) PRIMARY KEY,
    [targetname] varchar(100) NOT NULL,
    [targetfaction] varchar(50) NOT NULL,
    [targetwounds] int NOT NULL,
    [targettoughness] int NOT NULL,
    [targetsave] int NOT NULL
);