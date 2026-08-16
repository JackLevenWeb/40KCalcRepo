create table [dbo].[gold_dim_target_base]
(
    [target_base_sk] int identity(1,1) primary key,
    [targetname] varchar(100) not null,
    [targetfaction] varchar(50) not null,
    [targetwounds] int not null,
    [targettoughness] int not null,
    [targetsave] int not null
);