-- Extend MVP schema to fully persist current dashboard UI fields
-- Safe to re-run.

-- Operators: add extra profile fields
alter table operators
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists avatar_url text;

-- Tasks: add fields used by the dashboard
alter table tasks
  add column if not exists priority text not null default 'media',
  add column if not exists due_date date,
  add column if not exists tags text[] not null default '{}',
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists reminder text;

create index if not exists tasks_due_date_idx on tasks(due_date);

-- Task events: allow actor reference (optional)
alter table task_events
  add column if not exists actor_operator_id uuid null references operators(id) on delete set null;

create index if not exists task_events_actor_idx on task_events(actor_operator_id);
