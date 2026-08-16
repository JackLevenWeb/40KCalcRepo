create procedure [dbo].[sp_LoadSilverDistributions]
as
begin
    set nocount on;

    insert into dbo.silver_distributions
        (runid, category, rollvalue, occurrencecount)
    select
        SessionData.run_id,
        -- standardizes the category name by stripping out the word distribution
        replace(Dist.[key], '_distribution', '') as category,
        cast(DistDetails.[key] as int) as rollvalue,
        cast(DistDetails.[value] as int) as occurrencecount
    from dbo.bronze_rawtelemetry b
    cross apply openjson(b.jsonpayload, '$.session_data') with (
        run_id uniqueidentifier '$.run_id'
    ) as SessionData
    
    -- unpivot the main raw_data object to dynamically grab the category keys
    cross apply openjson(b.jsonpayload, '$.raw_data') as Dist
    
    -- unpivot the nested objects to dynamically grab the exact dice rolls and counts
    cross apply openjson(Dist.[value]) as DistDetails
        left join dbo.silver_distributions existing_d
        on existing_d.runid = SessionData.run_id
            -- apply the database default collation to the dynamic json key so the text rules match
            and existing_d.category = replace(Dist.[key], '_distribution', '') collate database_default
            and existing_d.rollvalue = cast(DistDetails.[key] as int)
    where existing_d.runid is null;

end;