CREATE TABLE [dbo].[gold_dim_audit]
(
    [audit_sk] int IDENTITY(1,1) PRIMARY KEY,
    [runid] uniqueidentifier NOT NULL,
    [batchid] varchar(50) NOT NULL,
    [userid] varchar(100) NOT NULL,
    [timestamp] varchar(50) NOT NULL,
    [appversion] varchar(50) NOT NULL,
    [executiontimems] float NOT NULL,
    [deviceconcurrency] int NOT NULL,
    [simulationtype] varchar(50) NOT NULL
);