CREATE TABLE [dbo].[gold_dim_attacker_status] (
    [attacker_status_sk] INT IDENTITY(1, 1) PRIMARY KEY,
    [is_leader] BIT NOT NULL,
    [granted_keyword] VARCHAR(50) NULL
);

GO