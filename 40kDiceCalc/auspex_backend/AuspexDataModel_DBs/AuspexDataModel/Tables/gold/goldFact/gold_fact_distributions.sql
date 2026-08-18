CREATE TABLE dbo.gold_fact_distributions (
    distribution_sk INT IDENTITY(1, 1) NOT NULL,
    runid UNIQUEIDENTIFIER NOT NULL,
    category VARCHAR(50) NOT NULL,
    rollvalue INT NOT NULL,
    occurrencecount INT NOT NULL,
    CONSTRAINT pk_fact_distributions PRIMARY KEY NONCLUSTERED (distribution_sk)
);

GO
    CREATE CLUSTERED COLUMNSTORE INDEX cci_fact_distributions ON dbo.gold_fact_distributions;

GO