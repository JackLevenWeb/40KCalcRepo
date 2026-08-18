CREATE TABLE dbo.gold_fact_attacker_bridge (
    bridge_sk INT IDENTITY(1, 1) NOT NULL,
    runid UNIQUEIDENTIFIER NOT NULL,
    attacker_sk INT NOT NULL,
    attacker_status_sk INT NOT NULL,
    modifier_sk INT NOT NULL,
    CONSTRAINT pk_fact_bridge PRIMARY KEY NONCLUSTERED (bridge_sk),
    CONSTRAINT fk_bridge_attacker FOREIGN KEY (attacker_sk) REFERENCES dbo.gold_dim_attacker_profile(attacker_sk),
    CONSTRAINT fk_bridge_status FOREIGN KEY (attacker_status_sk) REFERENCES dbo.gold_dim_attacker_status(attacker_status_sk),
    CONSTRAINT fk_bridge_modifier FOREIGN KEY (modifier_sk) REFERENCES dbo.gold_dim_modifiers(modifier_sk)
);

GO
    CREATE CLUSTERED COLUMNSTORE INDEX cci_fact_attacker_bridge ON dbo.gold_fact_attacker_bridge;

GO