create procedure dbo.sp_LoadGoldDimTargetModifiers
as
begin
  set nocount on;

  insert into dbo.gold_dim_target_modifiers (
    target_def_minus_hit,
    target_def_minus_wound,
    target_def_minus_wound_str,
    target_def_cover,
    target_def_plus_one_save
  )
  select distinct
    ss.target_def_minus_hit,
    ss.target_def_minus_wound,
    ss.target_def_minus_wound_str,
    ss.target_def_cover,
    ss.target_def_plus_one_save
  from dbo.silver_simulations as ss
  where not exists (
    select 1
    from dbo.gold_dim_target_modifiers as tm
    where
      tm.target_def_minus_hit = ss.target_def_minus_hit
      and tm.target_def_minus_wound = ss.target_def_minus_wound
      and tm.target_def_minus_wound_str = ss.target_def_minus_wound_str
      and tm.target_def_cover = ss.target_def_cover
      and tm.target_def_plus_one_save = ss.target_def_plus_one_save
  );
end;
go