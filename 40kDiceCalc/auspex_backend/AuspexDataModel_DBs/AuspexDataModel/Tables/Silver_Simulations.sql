-- main table for 1 to 1 session and target data
create table [dbo].[silver_simulations]
(
    [runid] uniqueidentifier primary key,
    [batchid] varchar(50) not null,
    [userid] varchar(100) not null,
    [timestamp] datetime2 not null,
    [appversion] varchar(50) not null,
    [executiontimems] float not null,
    [deviceconcurrency] int not null,
    [simulationtype] varchar(50) not null,
    [totaliterations] int not null,

    -- target unit stats
    [targetname] varchar(100) not null,
    [targetfaction] varchar(50) not null,
    [targetwounds] int not null,
    [targettoughness] int not null,
    [targetsave] int not null
);