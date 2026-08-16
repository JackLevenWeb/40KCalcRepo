create table [dbo].[gold_dim_audit]
(
    [audit_sk] int identity(1,1) primary key,
    [runid] uniqueidentifier not null,
    [batchid] varchar(50) not null,
    [userid] varchar(100) not null,
    [timestamp] varchar(50) not null,
    [appversion] varchar(50) not null,
    [executiontimems] float not null,
    [deviceconcurrency] int not null,
    [simulationtype] varchar(50) not null
);