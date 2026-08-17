create table dbo.gold_dim_attacker_status (
  attacker_status_sk int identity(1, 1) primary key,
  is_leader bit not null,
  granted_keyword varchar(50) null
);