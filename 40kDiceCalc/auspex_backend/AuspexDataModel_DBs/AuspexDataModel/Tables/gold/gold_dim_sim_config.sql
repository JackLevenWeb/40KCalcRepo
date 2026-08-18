CREATE TABLE [dbo].[gold_dim_sim_config] (
    [sim_config_sk] int IDENTITY(1, 1) PRIMARY KEY,
    [simulationtype] varchar(50) NOT NULL,
    [totaliterations] int NOT NULL
);