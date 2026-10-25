-- Authenticated account storage for the current to.daily application.
-- Existing legacy projects/tasks/time_entries tables are left untouched.
begin;
create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  constraint workspace_shape check ((
    data->>'version' = '1' and data->'user'->>'id' = user_id::text
    and jsonb_typeof(data->'user') = 'object'
    and jsonb_typeof(data->'projects') = 'array'
    and jsonb_typeof(data->'tasks') = 'array'
    and jsonb_typeof(data->'sessions') = 'array'
    and jsonb_typeof(data->'activities') = 'array'
    and jsonb_typeof(data->'checkIns') = 'array'
    and jsonb_typeof(data->'challenges') = 'array'
    and jsonb_typeof(data->'completions') = 'array'
  ) is true)
);
alter table public.user_workspaces enable row level security;
revoke all on public.user_workspaces from anon, authenticated;
grant select, insert, update on public.user_workspaces to authenticated;
drop policy if exists workspace_read on public.user_workspaces;
create policy workspace_read on public.user_workspaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists workspace_create on public.user_workspaces;
create policy workspace_create on public.user_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists workspace_update on public.user_workspaces;
create policy workspace_update on public.user_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
