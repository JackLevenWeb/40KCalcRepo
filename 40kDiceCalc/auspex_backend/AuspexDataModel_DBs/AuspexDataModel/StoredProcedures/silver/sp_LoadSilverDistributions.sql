CREATE PROCEDURE [dbo].[sp_LoadSilverDistributions] AS BEGIN
SET
    NOCOUNT ON;

INSERT INTO
    [dbo].[silver_distributions] (runid, category, rollvalue, occurrencecount)
SELECT
    SessionData.run_id,
    -- standardizes the category name BY stripping out the word distribution
    REPLACE(Dist.[key], '_distribution', '') AS category,
    CAST(DistDetails.[key] AS int) AS rollvalue,
    CAST(DistDetails.[value] AS int) AS occurrencecount
FROM
    [dbo].[bronze_rawtelemetry] b
    CROSS APPLY OPENJSON(b.jsonpayload, '$.session_data') WITH (run_id uniqueidentifier '$.run_id') AS SessionData -- unpivot the main raw_data object to dynamically grab the category keys
    CROSS APPLY OPENJSON(b.jsonpayload, '$.raw_data') AS Dist -- unpivot the nested objects to dynamically grab the exact dice rolls AND counts
    CROSS APPLY OPENJSON(Dist.[value]) AS DistDetails
    LEFT JOIN [dbo].[silver_distributions] existing_d ON existing_d.runid = SessionData.run_id -- APPLY the database DEFAULT collation to the dynamic json KEY so the text rules match
    AND existing_d.category = REPLACE(Dist.[key], '_distribution', '') COLLATE DATABASE_DEFAULT
    AND existing_d.rollvalue = CAST(DistDetails.[key] AS int)
WHERE
    existing_d.runid IS NULL;

END;