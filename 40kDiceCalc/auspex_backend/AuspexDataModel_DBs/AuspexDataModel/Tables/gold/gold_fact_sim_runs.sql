CREATE TABLE [dbo].[gold_fact_sim_runs]
(
    [fact_sk] int IDENTITY(1,1) PRIMARY KEY,
    [runid] uniqueidentifier NOT NULL,

    -- The Dimension Links (Foreign Keys)
    [audit_sk] int NOT NULL,
    [sim_config_sk] int NOT NULL,
    [target_base_sk] int NOT NULL,
    [target_modifier_sk] int NOT NULL,

    -- Phase Aggregates (The Math)
    [attacks_rolled] float NULL,
    [hits_raw_successes] float NULL,
    [hits_bonus_hits] float NULL,
    [hits_auto_wounds] float NULL,
    [wounds_raw_successes] float NULL,
    [wounds_dev_wounds] float NULL,
    [wounds_normal_wounds] float NULL,
    [saves_failed_count] float NULL,
    [damage_total] float NULL,
    [damage_models_killed] float NULL,
    [damage_wasted] float NULL,
    [final_health] float NULL,

    -- Enforcing Referential Integrity
    CONSTRAINT fk_fact_audit FOREIGN KEY ([audit_sk]) REFERENCES [dbo].[gold_dim_audit]([audit_sk]),
    CONSTRAINT fk_fact_sim_config FOREIGN KEY ([sim_config_sk]) REFERENCES [dbo].[gold_dim_sim_config]([sim_config_sk]),
    CONSTRAINT fk_fact_target_base FOREIGN KEY ([target_base_sk]) REFERENCES [dbo].[gold_dim_target_base]([target_base_sk]),
    CONSTRAINT fk_fact_target_mod FOREIGN KEY ([target_modifier_sk]) REFERENCES [dbo].[gold_dim_target_modifiers]([target_modifier_sk])
);