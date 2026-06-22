-- FLIP — initial database schema
-- Run this in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run (uses if-not-exists / replace / drop-if-exists).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per signed-up user, mirrors auth.users.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  created_at timestamptz not null default now()
);

-- Sourcing scans (the verdict screen results).
create table if not exists public.scans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  source     text,                       -- 'amazon' | 'sams'
  source_url text,
  source_id  text,                       -- ASIN / club item number
  title      text,
  est_net    numeric(10,2),
  margin_pct numeric(5,2),
  verdict    text,                       -- 'worth_listing' | 'review' | 'skip'
  data       jsonb,                      -- full payload: checks, velocity, comps, pricing
  created_at timestamptz not null default now()
);

-- Published / draft eBay listings.
create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  title           text not null,
  source          text,                  -- 'amazon' | 'sams'
  source_id       text,
  sku             text,
  status          text not null default 'active',  -- active | sold | paused | ended | draft
  list_price      numeric(10,2),
  source_cost     numeric(10,2),
  net_profit      numeric(10,2),
  quantity        integer default 1,
  ebay_listing_id text,
  image_urls      text[],
  views           integer default 0,
  product_variant text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Sold orders to fulfill from the source.
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  listing_id      uuid references public.listings (id) on delete set null,
  ebay_order_id   text,
  buyer_name      text,
  ship_address    text,
  state           text not null default 'new',  -- new | ordered | shipped | delivered | closed
  source_url      text,
  amazon_order_id text,
  tracking        text,
  net             numeric(10,2),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Inventory monitor alerts.
create table if not exists public.alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete cascade,
  type       text,                       -- oos | price_jump | competitor | not_amazon | margin
  message    text,
  severity   text,                       -- 'paused' | 'review'
  status     text not null default 'open',  -- open | resolved
  created_at timestamptz not null default now()
);

-- Per-user monitor rules.
create table if not exists public.rules (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  key        text not null,              -- auto_pause_oos | margin_floor | pause_if_not_amazon | auto_reprice | notify
  enabled    boolean not null default true,
  threshold  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_rules_updated_at on public.rules;
create trigger trg_rules_updated_at
  before update on public.rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a user signs up
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row-level security: each user can only see / change their own rows
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.scans    enable row level security;
alter table public.listings enable row level security;
alter table public.orders   enable row level security;
alter table public.alerts   enable row level security;
alter table public.rules    enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own scans" on public.scans;
create policy "own scans" on public.scans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own listings" on public.listings;
create policy "own listings" on public.listings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own alerts" on public.alerts;
create policy "own alerts" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rules" on public.rules;
create policy "own rules" on public.rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
