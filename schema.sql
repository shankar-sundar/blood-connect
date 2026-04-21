-- BloodConnect — full schema for a fresh Supabase project
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Auth is handled by the app (custom JWT). Supabase is used as a plain Postgres host.
-- RLS is NOT enabled — authorization is enforced in API route handlers.

-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";


-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  id            uuid primary key default uuid_generate_v4(),
  role          text not null check (role in ('donor', 'hospital', 'admin')),
  password_hash text not null,

  -- donor fields
  first_name    text,
  last_name     text,
  blood_group   text check (blood_group in ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  dob           date,
  gender        text,
  available     boolean not null default true,

  -- hospital fields
  org_name      text,
  org_type      text,
  address       text,
  license_no    text,

  -- shared
  email         text unique not null,
  mobile        text,
  city          text,
  lat           numeric,
  lng           numeric,

  created_at    timestamptz not null default now()
);

create table if not exists public.blood_requests (
  id            uuid primary key default uuid_generate_v4(),
  hospital_id   uuid not null references public.profiles(id) on delete cascade,
  blood_group   text not null check (blood_group in ('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  units         integer not null check (units > 0),
  component     text not null,
  urgency       text not null check (urgency in ('critical','urgent','scheduled')),
  urgency_rank  integer not null check (urgency_rank in (1,2,3)),
  description   text not null,
  status        text not null default 'open' check (status in ('open','closed','cancelled')),
  created_at    timestamptz not null default now()
);

create table if not exists public.acceptances (
  id            uuid primary key default uuid_generate_v4(),
  request_id    uuid not null references public.blood_requests(id) on delete cascade,
  donor_id      uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','accepted','donated','rejected')),
  created_at    timestamptz not null default now(),

  unique (request_id, donor_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_blood_requests_blood_group_status
  on public.blood_requests(blood_group, status, urgency_rank);

create index if not exists idx_blood_requests_hospital_id
  on public.blood_requests(hospital_id, status);

create index if not exists idx_acceptances_donor_id
  on public.acceptances(donor_id);

create index if not exists idx_acceptances_request_id
  on public.acceptances(request_id);

create index if not exists idx_profiles_email
  on public.profiles(email);
