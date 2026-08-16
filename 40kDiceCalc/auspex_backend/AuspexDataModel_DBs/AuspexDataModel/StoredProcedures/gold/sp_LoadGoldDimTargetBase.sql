create procedure [dbo].[sp_LoadGoldDimTargetBase]
as
begin
    set nocount on;

    insert into dbo.gold_dim_target_base
        (
        targetname,
        targetfaction,
        targetwounds,
        targettoughness,
        targetsave
        )
    select distinct
        ss.targetname,
        ss.targetfaction,
        ss.targetwounds,
        ss.targettoughness,
        ss.targetsave
    from dbo.silver_simulations ss
    where not exists (
        select 1
    from dbo.gold_dim_target_base tb
    where tb.targetname = ss.targetname
        and tb.targetfaction = ss.targetfaction
        and tb.targetwounds = ss.targetwounds
        and tb.targettoughness = ss.targettoughness
        and tb.targetsave = ss.targetsave
    );
end;