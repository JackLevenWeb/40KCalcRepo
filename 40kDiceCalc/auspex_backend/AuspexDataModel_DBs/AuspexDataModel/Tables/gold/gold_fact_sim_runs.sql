create table [dbo].[gold_fact_sim_runs]
(
    [fact_sk] int identity(1,1) primary key,
    [runid] uniqueidentifier not null,

    -- The Dimension Links (Foreign Keys)
    [audit_sk] int not null,
    [sim_config_sk] int not null,
    [target_base_sk] int not null,
    [target_modifier_sk] int not null,

    -- Phase Aggregates (The Math)
    [attacks_rolled] float null,
    [hits_raw_successes] float null,
    [hits_bonus_hits] float null,
    [hits_auto_wounds] float null,
    [wounds_raw_successes] float null,
    [wounds_dev_wounds] float null,
    [wounds_normal_wounds] float null,
    [saves_failed_count] float null,
    [damage_total] float null,
    [damage_models_killed] float null,
    [damage_wasted] float null,
    [final_health] float null,

    -- Enforcing Referential Integrity
    constraint fk_fact_audit foreign key ([audit_sk]) references [dbo].[gold_dim_audit]([audit_sk]),
    constraint fk_fact_sim_config foreign key ([sim_config_sk]) references [dbo].[gold_dim_sim_config]([sim_config_sk]),
    constraint fk_fact_target_base foreign key ([target_base_sk]) references [dbo].[gold_dim_target_base]([target_base_sk]),
    constraint fk_fact_target_mod foreign key ([target_modifier_sk]) references [dbo].[gold_dim_target_modifiers]([target_modifier_sk])
);