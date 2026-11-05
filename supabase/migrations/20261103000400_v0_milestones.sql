-- rollback: restore the previous constraints after removing d150 records; preserve historic d500/d1000 records.
alter table public.milestone_celebration
  drop constraint milestone_celebration_milestone_key_check,
  drop constraint milestone_celebration_check,
  add constraint milestone_celebration_milestone_key_check check (milestone_key ~ '^(d(50|100|150|200|300|500|1000)|y[1-9][0-9]*)$'),
  add constraint milestone_celebration_check check ((kind='day' and milestone_days in (50,100,150,200,300,500,1000) and anniversary_n is null and priority=1)
    or (kind='anniversary' and milestone_days is null and anniversary_n >= 1 and priority=2));
