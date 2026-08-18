CREATE TABLE [dbo].[gold_dim_attacker_status] (
    [attacker_status_sk] int IDENTITY(1, 1) PRIMARY KEY,
    [is_leader] bit NOT NULL,
    [granted_keyword] varchar(50) NULL
);

GO