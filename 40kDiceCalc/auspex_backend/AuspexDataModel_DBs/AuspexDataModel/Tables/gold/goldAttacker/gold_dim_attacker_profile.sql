CREATE TABLE [dbo].[gold_dim_attacker_profile] (
    [attacker_sk] INT IDENTITY(1, 1) PRIMARY KEY,
    [unitname] VARCHAR(100) NOT NULL,
    [faction] VARCHAR(50) NOT NULL,
    [models] INT NOT NULL,
    [attacks] VARCHAR(50) NOT NULL,
    [bs_ws] VARCHAR(10) NOT NULL,
    [strength] INT NOT NULL,
    [ap] INT NOT NULL,
    [damage] VARCHAR(50) NOT NULL,
    [unit_count] INT NOT NULL
);

GO 