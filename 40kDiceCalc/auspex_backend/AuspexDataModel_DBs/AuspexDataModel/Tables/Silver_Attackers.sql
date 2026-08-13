-- child table for the attacker array linked by runid
create table [dbo].[silver_attackers]
(
    [attackerid] uniqueidentifier default newsequentialid() primary key,
    [runid] uniqueidentifier not null,
    [attackername] varchar(100) not null,
    [attackerfaction] varchar(50) not null,
    [models] int not null,
    [attacks] varchar(50) not null,

    -- link to main sim table
    constraint fk_silverattackers_runid foreign key ([runid]) references [dbo].[silver_simulations]([runid])
);