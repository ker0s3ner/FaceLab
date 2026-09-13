-- FaceLab: skin type for personalized skincare tips.
-- Run once in Supabase SQL editor. Safe to re-run.
alter table public.user_state
  add column if not exists skin_type text not null default 'combination';
