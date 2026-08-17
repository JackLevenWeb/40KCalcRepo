create table dbo.gold_dim_attacker_profile (
  attacker_sk int identity(1, 1) primary key,
  unitname varchar(100) not null,
  faction varchar(50) not null,
  models int not null,
  attacks varchar(50) not null,
  bs_ws varchar(10) not null,
  strength int not null,
  ap int not null,
  damage varchar(50) not null,
  unit_count int not null
);