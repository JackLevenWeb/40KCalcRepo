CREATE TABLE dbo.gold_fact_sim_runs (
    fact_sk INT IDENTITY(1, 1) NOT NULL,
    runid UNIQUEIDENTIFIER NOT NULL,
    audit_sk INT NOT NULL,
    sim_config_sk INT NOT NULL,
    target_base_sk INT NOT NULL,
    target_modifier_sk INT NOT NULL,
    attacks_rolled FLOAT NULL,
    hits_raw_successes FLOAT NULL,
    hits_bonus_hits FLOAT NULL,
    hits_auto_wounds FLOAT NULL,
    wounds_raw_successes FLOAT NULL,
    wounds_dev_wounds FLOAT NULL,
    wounds_normal_wounds FLOAT NULL,
    saves_failed_count FLOAT NULL,
    damage_total FLOAT NULL,
    damage_models_killed FLOAT NULL,
    damage_wasted FLOAT NULL,
    final_health FLOAT NULL,
    -- Referential Integrity with a NONCLUSTERED Primary Key
    CONSTRAINT pk_fact_sim_runs PRIMARY KEY NONCLUSTERED (fact_sk),
    CONSTRAINT fk_fact_audit FOREIGN KEY (audit_sk) REFERENCES dbo.gold_dim_audit(audit_sk),
    CONSTRAINT fk_fact_sim_config FOREIGN KEY (sim_config_sk) REFERENCES dbo.gold_dim_sim_config(sim_config_sk),
    CONSTRAINT fk_fact_target_base FOREIGN KEY (target_base_sk) REFERENCES dbo.gold_dim_target_base(target_base_sk),
    CONSTRAINT fk_fact_target_mod FOREIGN KEY (target_modifier_sk) REFERENCES dbo.gold_dim_target_modifiers(target_modifier_sk)
);

GO
    -- columnstore compression for entire table
    CREATE CLUSTERED COLUMNSTORE INDEX cci_fact_sim_runs ON dbo.gold_fact_sim_runs;

GO