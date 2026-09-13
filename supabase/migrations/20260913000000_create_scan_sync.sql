-- FaceLab cross-device sync
-- Run this once in the Supabase SQL editor (Dashboard > SQL > New query).
-- Creates the tables + RLS policies the app's cloud sync expects.
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- 1. Scan analyses (one row per upload session, per user)
create table if not exists public.scan_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id text not null unique,
  created_at timestamptz not null default now(),
  label text not null default 'Today',
  front_photo text not null default '',
  side_photo text not null default '',
  pillars jsonb not null default '[]'::jsonb,
  overall_score double precision not null default 0,
  legacy_result jsonb,
  measurements jsonb,
  landmark_points jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists scan_analyses_user_id_idx on public.scan_analyses (user_id);
create index if not exists scan_analyses_client_id_idx on public.scan_analyses (client_id);

-- 2. Per-user state (plan actions, calibration)
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gender text not null default 'Male',
  ethnicity text not null default 'White / Caucasian',
  plan_actions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 3. Row Level Security
alter table public.scan_analyses enable row level security;
alter table public.user_state enable row level security;

drop policy if exists "Users manage own scans" on public.scan_analyses;
create policy "Users manage own scans"
  on public.scan_analyses
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own state" on public.user_state;
create policy "Users manage own state"
  on public.user_state
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
