-- Run this in Supabase SQL Editor.

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

drop policy if exists "public can insert messages" on public.messages;
create policy "public can insert messages"
on public.messages for insert
to anon, authenticated
with check (true);

drop policy if exists "admins can read messages" on public.messages;
create policy "admins can read messages"
on public.messages for select
to authenticated
using (true);

drop policy if exists "admins can update messages" on public.messages;
create policy "admins can update messages"
on public.messages for update
to authenticated
using (true)
with check (true);

drop policy if exists "admins can delete messages" on public.messages;
create policy "admins can delete messages"
on public.messages for delete
to authenticated
using (true);

-- IMPORTANT:
-- Create the one admin account from Supabase Authentication.
-- Do not put the email/password in this file or in the frontend.
