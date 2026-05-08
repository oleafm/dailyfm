-- Run this in your Supabase SQL editor

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#f59e0b',
  client text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  date date not null default current_date,
  hours numeric(5,2),
  notes text,
  started_at timestamptz,
  stopped_at timestamptz,
  is_running boolean default false,
  created_at timestamptz default now()
);

-- Index for fast date range queries
create index if not exists time_entries_date_idx on time_entries(date);
create index if not exists time_entries_project_idx on time_entries(project_id);
