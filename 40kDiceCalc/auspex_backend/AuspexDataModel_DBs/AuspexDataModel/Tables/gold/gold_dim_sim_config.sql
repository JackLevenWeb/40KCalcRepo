create table [dbo].[gold_dim_sim_config] (
    [sim_config_sk] int identity(1, 1) primary key,
    [simulationtype] varchar(50) not null,
    [totaliterations] int not null
);