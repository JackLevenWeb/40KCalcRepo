CREATE PROCEDURE [dbo].[sp_LoadGoldDimAttackerStatus]
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO [dbo].[gold_dim_attacker_status] (
        is_leader, 
        granted_keyword
    )
    SELECT DISTINCT
        sa.is_leader,
        sa.granted_keyword
    FROM [dbo].[silver_attackers] AS sa
    WHERE NOT EXISTS (
        SELECT 1
        FROM [dbo].[gold_dim_attacker_status] AS st
        WHERE st.is_leader = sa.is_leader
          AND ISNULL(st.granted_keyword, '') = ISNULL(sa.granted_keyword, '')
    );
END;
GO