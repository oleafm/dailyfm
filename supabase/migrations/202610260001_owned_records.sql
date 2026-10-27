-- Per-record account storage. Existing user_workspaces is retained as a recovery copy.
begin;
create table public.daily_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 200),
 revision bigint not null default 0 check(revision>=0)
);
create table public.daily_projects (
 user_id uuid not null references public.daily_accounts(user_id) on delete cascade,
 id text not null,
 payload jsonb not null,
 position integer not null default 0 check(position>=0),
 primary key(user_id,id),
 check ((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and length(payload->>'id') between 1 and 200 and jsonb_typeof(payload->'name')='string' and jsonb_typeof(payload->'description')='string' and jsonb_typeof(payload->'color')='string' and jsonb_typeof(payload->'milestones')='array') is true),
 check(id=payload->>'id')
);
create table public.daily_tasks (
 user_id uuid not null references public.daily_accounts(user_id) on delete cascade,
 id text not null,
 payload jsonb not null,
 position integer not null default 0 check(position>=0),
 primary key(user_id,id),
 check ((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and length(payload->>'id') between 1 and 200 and jsonb_typeof(payload->'title')='string' and jsonb_typeof(payload->'area')='string' and jsonb_typeof(payload->'category')='string' and jsonb_typeof(payload->'completed')='boolean' and payload->>'area' in ('do','be')) is true),
 check(id=payload->>'id'),
 project_id text generated always as (nullif(payload->>'projectId','')) stored,
 foreign key(user_id,project_id) references public.daily_projects(user_id,id) deferrable initially deferred
);
create index daily_tasks_project on public.daily_tasks(user_id,project_id);
create table public.daily_sessions (
 user_id uuid not null references public.daily_accounts(user_id) on delete cascade,
 id text not null,
 payload jsonb not null,
 position integer not null default 0 check(position>=0),
 primary key(user_id,id),
 check ((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and length(payload->>'id') between 1 and 200 and jsonb_typeof(payload->'startedAt')='string' and jsonb_typeof(payload->'durationSeconds')='number' and jsonb_typeof(payload->'date')='string' and jsonb_typeof(payload->'note')='string' and (payload->>'durationSeconds')::numeric >= 0) is true),
 check(id=payload->>'id'),
 project_id text generated always as (nullif(payload->>'projectId','')) stored,
 foreign key(user_id,project_id) references public.daily_projects(user_id,id) deferrable initially deferred,
 task_id text generated always as (nullif(payload->>'taskId','')) stored,
 foreign key(user_id,task_id) references public.daily_tasks(user_id,id) deferrable initially deferred
);
create index daily_sessions_date on public.daily_sessions(user_id, (payload->>'date'));
create index daily_sessions_project on public.daily_sessions(user_id,project_id);
-- Create indexes before backfill queues deferred foreign-key checks.
create index daily_sessions_started on public.daily_sessions(user_id,(payload->>'startedAt'));
create table public.daily_activities (
 user_id uuid not null references public.daily_accounts(user_id) on delete cascade,
 id text not null,
 payload jsonb not null,
 position integer not null default 0 check(position>=0),
 primary key(user_id,id),
 check ((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and length(payload->>'id') between 1 and 200 and jsonb_typeof(payload->'title')='string' and jsonb_typeof(payload->'date')='string' and jsonb_typeof(payload->'area')='string' and jsonb_typeof(payload->'category')='string' and jsonb_typeof(payload->'kind')='string' and jsonb_typeof(payload->'minutes')='number' and jsonb_typeof(payload->'source')='string' and payload->>'area' in ('do','be') and (payload->>'minutes')::numeric >= 0 and payload->>'kind' in ('session','activity','task','reflection','challenge') and payload->>'source' in ('manual','timer','sample')) is true),
 check(id=payload->>'id'),
 project_id text generated always as (nullif(payload->>'projectId','')) stored,
 foreign key(user_id,project_id) references public.daily_projects(user_id,id) deferrable initially deferred
);
create index daily_activities_date on public.daily_activities(user_id, (payload->>'date'));
create index daily_activities_project on public.daily_activities(user_id,project_id);
create table public.daily_check_ins (
 user_id uuid not null references public.daily_accounts(user_id) on delete cascade,
 id text not null,
 payload jsonb not null,
 position integer not null default 0 check(position>=0),
 primary key(user_id,id),
 check ((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and length(payload->>'id') between 1 and 200 and jsonb_typeof(payload->'date')='string' and jsonb_typeof(payload->'mood')='number' and jsonb_typeof(payload->'movedForward')='string' and jsonb_typeof(payload->'reflection')='object') is true),
 check(id=payload->>'id')
);
create index daily_check_ins_date on public.daily_check_ins(user_id, (payload->>'date'));
create table public.daily_challenges (
 user_id uuid not null references public.daily_accounts(user_id) on delete cascade,
 id text not null,
 payload jsonb not null,
 position integer not null default 0 check(position>=0),
 primary key(user_id,id),
 check ((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and length(payload->>'id') between 1 and 200 and jsonb_typeof(payload->'title')='string' and jsonb_typeof(payload->'description')='string' and jsonb_typeof(payload->'category')='string' and jsonb_typeof(payload->'target')='number' and jsonb_typeof(payload->'month')='string' and (payload->>'target')::numeric > 0) is true),
 check(id=payload->>'id')
);
create table public.daily_memories (
 user_id uuid not null references public.daily_accounts(user_id) on delete cascade,
 id text not null,
 payload jsonb not null,
 position integer not null default 0 check(position>=0),
 primary key(user_id,id),
 check ((jsonb_typeof(payload)='object' and jsonb_typeof(payload->'id')='string' and length(payload->>'id') between 1 and 200 and jsonb_typeof(payload->'challengeId')='string' and jsonb_typeof(payload->'title')='string' and jsonb_typeof(payload->'photo')='string' and jsonb_typeof(payload->'note')='string' and jsonb_typeof(payload->'date')='string' and jsonb_typeof(payload->'location')='string' and jsonb_typeof(payload->'again')='string' and payload->>'again' in ('Yes','Maybe','Absolutely not')) is true),
 check(id=payload->>'id'),
 challenge_id text generated always as (payload->>'challengeId') stored,
 foreign key(user_id,challenge_id) references public.daily_challenges(user_id,id) deferrable initially deferred
);
create index daily_memories_date on public.daily_memories(user_id, (payload->>'date'));
alter table public.daily_accounts enable row level security;
revoke all on public.daily_accounts from public, anon, authenticated;
grant select,insert,update,delete on public.daily_accounts to authenticated;
create policy own_rows on public.daily_accounts to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter table public.daily_projects enable row level security;
revoke all on public.daily_projects from public, anon, authenticated;
grant select,insert,update,delete on public.daily_projects to authenticated;
create policy own_rows on public.daily_projects to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter table public.daily_tasks enable row level security;
revoke all on public.daily_tasks from public, anon, authenticated;
grant select,insert,update,delete on public.daily_tasks to authenticated;
create policy own_rows on public.daily_tasks to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter table public.daily_sessions enable row level security;
revoke all on public.daily_sessions from public, anon, authenticated;
grant select,insert,update,delete on public.daily_sessions to authenticated;
create policy own_rows on public.daily_sessions to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter table public.daily_activities enable row level security;
revoke all on public.daily_activities from public, anon, authenticated;
grant select,insert,update,delete on public.daily_activities to authenticated;
create policy own_rows on public.daily_activities to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter table public.daily_check_ins enable row level security;
revoke all on public.daily_check_ins from public, anon, authenticated;
grant select,insert,update,delete on public.daily_check_ins to authenticated;
create policy own_rows on public.daily_check_ins to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter table public.daily_challenges enable row level security;
revoke all on public.daily_challenges from public, anon, authenticated;
grant select,insert,update,delete on public.daily_challenges to authenticated;
create policy own_rows on public.daily_challenges to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
alter table public.daily_memories enable row level security;
revoke all on public.daily_memories from public, anon, authenticated;
grant select,insert,update,delete on public.daily_memories to authenticated;
create policy own_rows on public.daily_memories to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create function public.daily_save_workspace(p_data jsonb, p_revision bigint) returns bigint
language plpgsql security invoker set search_path='' as $$
declare owner uuid:=auth.uid(); current_revision bigint; entity jsonb;
begin
 if owner is null or (p_data->'user'->>'id') is distinct from owner::text or (p_data->>'version') is distinct from '1' then raise exception 'Invalid account' using errcode='42501'; end if;
 select revision into current_revision from public.daily_accounts where user_id=owner for update;
 if current_revision is null or current_revision<>p_revision then raise exception 'Workspace conflict' using errcode='40001'; end if;
 if jsonb_typeof(p_data->'projects') is distinct from 'array' then raise exception 'Invalid projects'; end if;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->'projects')) then raise exception 'Duplicate projects identifiers'; end if;
 insert into public.daily_projects(user_id,id,payload,position)
 select owner,value->>'id',value,ordinality-1 from jsonb_array_elements(p_data->'projects') with ordinality
 on conflict(user_id,id) do update set payload=excluded.payload,position=excluded.position where daily_projects.payload is distinct from excluded.payload or daily_projects.position is distinct from excluded.position;
 delete from public.daily_projects where user_id=owner and id not in (select value->>'id' from jsonb_array_elements(p_data->'projects'));
 if jsonb_typeof(p_data->'tasks') is distinct from 'array' then raise exception 'Invalid tasks'; end if;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->'tasks')) then raise exception 'Duplicate tasks identifiers'; end if;
 insert into public.daily_tasks(user_id,id,payload,position)
 select owner,value->>'id',value,ordinality-1 from jsonb_array_elements(p_data->'tasks') with ordinality
 on conflict(user_id,id) do update set payload=excluded.payload,position=excluded.position where daily_tasks.payload is distinct from excluded.payload or daily_tasks.position is distinct from excluded.position;
 delete from public.daily_tasks where user_id=owner and id not in (select value->>'id' from jsonb_array_elements(p_data->'tasks'));
 if jsonb_typeof(p_data->'sessions') is distinct from 'array' then raise exception 'Invalid sessions'; end if;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->'sessions')) then raise exception 'Duplicate sessions identifiers'; end if;
 insert into public.daily_sessions(user_id,id,payload,position)
 select owner,value->>'id',value,ordinality-1 from jsonb_array_elements(p_data->'sessions') with ordinality
 on conflict(user_id,id) do update set payload=excluded.payload,position=excluded.position where daily_sessions.payload is distinct from excluded.payload or daily_sessions.position is distinct from excluded.position;
 delete from public.daily_sessions where user_id=owner and id not in (select value->>'id' from jsonb_array_elements(p_data->'sessions'));
 if jsonb_typeof(p_data->'activities') is distinct from 'array' then raise exception 'Invalid activities'; end if;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->'activities')) then raise exception 'Duplicate activities identifiers'; end if;
 insert into public.daily_activities(user_id,id,payload,position)
 select owner,value->>'id',value,ordinality-1 from jsonb_array_elements(p_data->'activities') with ordinality
 on conflict(user_id,id) do update set payload=excluded.payload,position=excluded.position where daily_activities.payload is distinct from excluded.payload or daily_activities.position is distinct from excluded.position;
 delete from public.daily_activities where user_id=owner and id not in (select value->>'id' from jsonb_array_elements(p_data->'activities'));
 if jsonb_typeof(p_data->'checkIns') is distinct from 'array' then raise exception 'Invalid checkIns'; end if;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->'checkIns')) then raise exception 'Duplicate checkIns identifiers'; end if;
 insert into public.daily_check_ins(user_id,id,payload,position)
 select owner,value->>'id',value,ordinality-1 from jsonb_array_elements(p_data->'checkIns') with ordinality
 on conflict(user_id,id) do update set payload=excluded.payload,position=excluded.position where daily_check_ins.payload is distinct from excluded.payload or daily_check_ins.position is distinct from excluded.position;
 delete from public.daily_check_ins where user_id=owner and id not in (select value->>'id' from jsonb_array_elements(p_data->'checkIns'));
 if jsonb_typeof(p_data->'challenges') is distinct from 'array' then raise exception 'Invalid challenges'; end if;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->'challenges')) then raise exception 'Duplicate challenges identifiers'; end if;
 insert into public.daily_challenges(user_id,id,payload,position)
 select owner,value->>'id',value,ordinality-1 from jsonb_array_elements(p_data->'challenges') with ordinality
 on conflict(user_id,id) do update set payload=excluded.payload,position=excluded.position where daily_challenges.payload is distinct from excluded.payload or daily_challenges.position is distinct from excluded.position;
 delete from public.daily_challenges where user_id=owner and id not in (select value->>'id' from jsonb_array_elements(p_data->'challenges'));
 if jsonb_typeof(p_data->'completions') is distinct from 'array' then raise exception 'Invalid completions'; end if;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->'completions')) then raise exception 'Duplicate completions identifiers'; end if;
 insert into public.daily_memories(user_id,id,payload,position)
 select owner,value->>'id',value,ordinality-1 from jsonb_array_elements(p_data->'completions') with ordinality
 on conflict(user_id,id) do update set payload=excluded.payload,position=excluded.position where daily_memories.payload is distinct from excluded.payload or daily_memories.position is distinct from excluded.position;
 delete from public.daily_memories where user_id=owner and id not in (select value->>'id' from jsonb_array_elements(p_data->'completions'));
 update public.daily_accounts set name=p_data->'user'->>'name',revision=revision+1 where user_id=owner returning revision into current_revision;
 return current_revision;
end $$;
create function public.daily_load_workspace(p_initial jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare owner uuid:=auth.uid(); result jsonb;
begin
 if owner is null or (p_initial->'user'->>'id') is distinct from owner::text then raise exception 'Invalid account' using errcode='42501'; end if;
 insert into public.daily_accounts(user_id,name) values(owner,p_initial->'user'->>'name') on conflict do nothing;
 -- Serialize a consistent read with the caller's saves.
 perform 1 from public.daily_accounts where user_id=owner for update;
 select jsonb_build_object('revision',revision,'data',jsonb_build_object('version',1,'user',jsonb_build_object('id',owner,'name',name))) into result from public.daily_accounts where user_id=owner;
 result=jsonb_set(result,array['data','projects'],(select coalesce(jsonb_agg(payload order by position,id),'[]'::jsonb) from public.daily_projects where user_id=owner));
 result=jsonb_set(result,array['data','tasks'],(select coalesce(jsonb_agg(payload order by position,id),'[]'::jsonb) from public.daily_tasks where user_id=owner));
 result=jsonb_set(result,array['data','sessions'],(select coalesce(jsonb_agg(payload order by position,id),'[]'::jsonb) from public.daily_sessions where user_id=owner));
 result=jsonb_set(result,array['data','activities'],(select coalesce(jsonb_agg(payload order by position,id),'[]'::jsonb) from public.daily_activities where user_id=owner));
 result=jsonb_set(result,array['data','checkIns'],(select coalesce(jsonb_agg(payload order by position,id),'[]'::jsonb) from public.daily_check_ins where user_id=owner));
 result=jsonb_set(result,array['data','challenges'],(select coalesce(jsonb_agg(payload order by position,id),'[]'::jsonb) from public.daily_challenges where user_id=owner));
 result=jsonb_set(result,array['data','completions'],(select coalesce(jsonb_agg(payload order by position,id),'[]'::jsonb) from public.daily_memories where user_id=owner));
 return result;
end $$;
revoke all on function public.daily_load_workspace(jsonb) from public,anon;
revoke all on function public.daily_save_workspace(jsonb,bigint) from public,anon;
grant execute on function public.daily_load_workspace(jsonb) to authenticated;
grant execute on function public.daily_save_workspace(jsonb,bigint) to authenticated;
-- Validate and backfill existing accounts in this transaction. Invalid legacy
-- data aborts the entire migration; no records are silently discarded.
insert into public.daily_accounts(user_id,name,revision)
select user_id,data->'user'->>'name',revision from public.user_workspaces;
insert into public.daily_projects(user_id,id,payload,position) select w.user_id,item.value->>'id',item.value,item.ordinality-1 from public.user_workspaces w cross join lateral jsonb_array_elements(w.data->'projects') with ordinality as item;
insert into public.daily_tasks(user_id,id,payload,position) select w.user_id,item.value->>'id',item.value,item.ordinality-1 from public.user_workspaces w cross join lateral jsonb_array_elements(w.data->'tasks') with ordinality as item;
insert into public.daily_sessions(user_id,id,payload,position) select w.user_id,item.value->>'id',item.value,item.ordinality-1 from public.user_workspaces w cross join lateral jsonb_array_elements(w.data->'sessions') with ordinality as item;
insert into public.daily_activities(user_id,id,payload,position) select w.user_id,item.value->>'id',item.value,item.ordinality-1 from public.user_workspaces w cross join lateral jsonb_array_elements(w.data->'activities') with ordinality as item;
insert into public.daily_check_ins(user_id,id,payload,position) select w.user_id,item.value->>'id',item.value,item.ordinality-1 from public.user_workspaces w cross join lateral jsonb_array_elements(w.data->'checkIns') with ordinality as item;
insert into public.daily_challenges(user_id,id,payload,position) select w.user_id,item.value->>'id',item.value,item.ordinality-1 from public.user_workspaces w cross join lateral jsonb_array_elements(w.data->'challenges') with ordinality as item;
insert into public.daily_memories(user_id,id,payload,position) select w.user_id,item.value->>'id',item.value,item.ordinality-1 from public.user_workspaces w cross join lateral jsonb_array_elements(w.data->'completions') with ordinality as item;
-- Old clients must not create a diverging second source of truth after upgrade.
revoke insert,update,delete on public.user_workspaces from authenticated;
-- Retire unscoped tables from the earlier prototype, if they were installed.
do $$ declare old_table text; begin
 foreach old_table in array array['projects','tasks','time_entries'] loop
  if to_regclass('public.'||old_table) is not null then
   execute format('alter table public.%I enable row level security',old_table);
   execute format('revoke all on public.%I from public,anon,authenticated',old_table);
  end if;
 end loop;
end $$;
commit;
