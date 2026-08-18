CREATE TABLE [dbo].[gold_dim_attacker_profile] (
    [attacker_sk] int IDENTITY(1, 1) PRIMARY KEY,
    [unitname] varchar(100) NOT NULL,
    [faction] varchar(50) NOT NULL,
    [models] int NOT NULL,
    [attacks] varchar(50) NOT NULL,
    [bs_ws] varchar(10) NOT NULL,
    [strength] int NOT NULL,
    [ap] int NOT NULL,
    [damage] varchar(50) NOT NULL,
    [unit_count] int NOT NULL
);

GO 