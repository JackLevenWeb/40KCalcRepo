CREATE PROCEDURE [dbo].[sp_LoadGoldFactDistributions] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[gold_fact_distributions] (
        runid,
        category,
        rollvalue,
        occurrencecount
    )
SELECT
    sd.runid,
    sd.category,
    sd.rollvalue,
    sd.occurrencecount
FROM
    [dbo].[silver_distributions] AS sd
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            [dbo].[gold_fact_distributions] AS fd
        WHERE
            fd.runid = sd.runid
            AND fd.category = sd.category
            AND fd.rollvalue = sd.rollvalue
    );

END;

GO