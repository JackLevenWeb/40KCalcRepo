CREATE PROCEDURE [dbo].[sp_LoadGoldDimAudit]
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[gold_dim_audit] (
        runid,
        batchid,
        userid,
        [timestamp],
        appversion,
        executiontimems,
        deviceconcurrency,
        simulationtype
    )
    SELECT DISTINCT
        ss.runid,
        ss.batchid,
        ss.userid,
        ss.[timestamp],
        ss.appversion,
        ss.executiontimems,
        ss.deviceconcurrency,
        ss.simulationtype
    FROM [dbo].[silver_simulations] AS ss
    WHERE NOT EXISTS (
        SELECT 1
        FROM [dbo].[gold_dim_audit] AS a
        WHERE a.runid = ss.runid
    );
END;
GO