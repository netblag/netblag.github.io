-- Netblag Supabase schema
-- Run this in Supabase SQL Editor.

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;
alter table public.admin_users enable row level security;

revoke all on table public.messages from anon;
revoke all on table public.messages from authenticated;
revoke all on table public.admin_users from anon;
revoke all on table public.admin_users from authenticated;

grant insert on table public.messages to anon;
grant select, insert, update, delete on table public.messages to authenticated;

grant select on table public.admin_users to authenticated;

drop policy if exists "public can insert messages" on public.messages;
create policy "public can insert messages"
on public.messages
for insert
to anon, authenticated
with check (
  char_length(name) between 1 and 80
  and char_length(message) between 1 and 2000
);

drop policy if exists "admins can read messages" on public.messages;
create policy "admins can read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "admins can update messages" on public.messages;
create policy "admins can update messages"
on public.messages
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "admins can delete messages" on public.messages;
create policy "admins can delete messages"
on public.messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "admins can read own admin record" on public.admin_users;
create policy "admins can read own admin record"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- IMPORTANT:
-- 1. Create your single admin user in Authentication > Users.
-- 2. Copy that user's UUID.
-- 3. Run:
--    insert into public.admin_users (user_id) values ('YOUR-USER-UUID');
--
-- Do NOT create a public signup flow for this site.
