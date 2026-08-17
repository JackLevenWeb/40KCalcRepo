create procedure dbo.sp_LoadGoldDimAttackerProfile
as
begin
  set nocount on;

  insert into dbo.gold_dim_attacker_profile (
    unitname,
    faction,
    models,
    attacks,
    bs_ws,
    strength,
    ap,
    damage,
    unit_count
  )
  select distinct
    sa.attackername,
    sa.attackerfaction,
    sa.models,
    sa.attacks,
    sa.bs_ws,
    sa.strength,
    sa.ap,
    sa.damage,
    sa.unit_count
  from dbo.silver_attackers as sa
  where not exists (
    select 1
    from dbo.gold_dim_attacker_profile as ap
    where
      sa.attackername = ap.unitname and sa.attackerfaction = ap.faction
      and sa.models = ap.models and sa.attacks = ap.attacks
      and sa.bs_ws = ap.bs_ws and sa.strength = ap.strength and sa.ap = ap.ap
      and sa.damage = ap.damage and sa.unit_count = ap.unit_count
  );
end;
go