-- child table for raw monte carlo distributions linked by runid
create table [dbo].[silver_distributions] (
    [distid] uniqueidentifier default newsequentialid() primary key,
    [runid] uniqueidentifier not null,
    [category] varchar(50) not null,
    [rollvalue] int not null,
    [occurrencecount] int not null -- llink to main simulation table
    constraint fk_silverdist_runid foreign key ([runid]) references [dbo].[silver_simulations]([runid])
);  