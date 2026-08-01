-- AutoAlert Sprint 1: profiles, roles, and RLS baseline.
-- Run this migration in the Supabase SQL Editor or with the Supabase CLI.

create type public.user_role as enum ('owner', 'mechanic');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone text check (phone is null or char_length(phone) <= 30),
  role public.user_role not null default 'owner',
  currency_code char(3) not null default 'HNL',
  email_alerts_enabled boolean not null default true,
  whatsapp_alerts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are readable by their owner"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Profiles are insertable by their owner"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Profiles are editable by their owner"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'Usuario'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case when new.raw_user_meta_data ->> 'role' = 'mechanic' then 'mechanic'::public.user_role else 'owner'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
