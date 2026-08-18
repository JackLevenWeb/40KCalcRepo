-- child table for raw monte carlo distributions linked by runid
CREATE TABLE [dbo].[silver_distributions] (
    [distid] uniqueidentifier DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    [runid] uniqueidentifier NOT NULL,
    [category] varchar(50) NOT NULL,
    [rollvalue] int NOT NULL,
    [occurrencecount] int NOT NULL -- llink to main simulation table
    CONSTRAINT fk_silverdist_runid FOREIGN KEY ([runid]) REFERENCES [dbo].[silver_simulations]([runid])
);  