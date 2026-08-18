CREATE PROCEDURE [dbo].[sp_LoadGoldDimSimConfig] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[gold_dim_sim_config] (simulationtype, totaliterations)
SELECT
    DISTINCT s.simulationtype,
    s.totaliterations
FROM
    [dbo].[silver_simulations] s
    LEFT JOIN [dbo].[gold_dim_sim_config] d ON s.simulationtype = d.simulationtype
    AND s.totaliterations = d.totaliterations
WHERE
    d.sim_config_sk IS NULL
    AND s.simulationtype IS NOT NULL;

END;

GO