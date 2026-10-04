-- Catalog product facts. Apply in the Supabase SQL editor. No secrets belong in this file.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'trial',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.catalog_stores (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 200),
  sku text check (sku is null or char_length(sku) between 1 and 80),
  specs jsonb not null default '[]'::jsonb,
  price_amount numeric(12,2) not null check (price_amount >= 0 and price_amount <= 999999.99),
  price_currency text not null check (price_currency ~ '^[A-Z]{3}$'),
  availability text not null check (availability in ('in_stock', 'out_of_stock', 'quantity')),
  quantity integer,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'RETIRED')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_products_specs_array check (jsonb_typeof(specs) = 'array'),
  constraint catalog_products_quantity_shape check (
    (availability = 'quantity' and quantity is not null and quantity >= 0 and quantity <= 1000000)
    or (availability in ('in_stock', 'out_of_stock') and quantity is null)
  )
);

create table if not exists public.catalog_support_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_request_buckets (
  user_id uuid primary key,
  window_start timestamptz not null,
  hits integer not null
);

create index if not exists catalog_stores_owner_idx on public.catalog_stores (owner_id, updated_at desc);
create index if not exists catalog_products_store_idx on public.catalog_products (store_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.catalog_stores enable row level security;
alter table public.catalog_products enable row level security;
alter table public.catalog_support_requests enable row level security;
alter table public.catalog_request_buckets enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "own stores" on public.catalog_stores
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own products" on public.catalog_products
  for all to authenticated
  using (exists (select 1 from public.catalog_stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.catalog_stores s where s.id = store_id and s.owner_id = auth.uid()));

create or replace function public.handle_new_catalog_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_catalog on auth.users;
create trigger on_auth_user_created_catalog
  after insert on auth.users
  for each row execute function public.handle_new_catalog_user();

create or replace function public.verify_catalog_connection()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select auth.uid() is not null
$$;

create or replace function public.consume_catalog_request(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket_start timestamptz := date_trunc('minute', now());
  next_hits integer;
begin
  if auth.role() is distinct from 'service_role' then
    return false;
  end if;
  insert into public.catalog_request_buckets as bucket (user_id, window_start, hits)
  values (p_user, bucket_start, 1)
  on conflict (user_id) do update
    set hits = case when bucket.window_start = excluded.window_start then bucket.hits + 1 else 1 end,
        window_start = excluded.window_start
  returning hits into next_hits;
  return next_hits <= 60;
end;
$$;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.catalog_stores to authenticated;
grant select, insert, update, delete on public.catalog_products to authenticated;
grant execute on function public.verify_catalog_connection() to authenticated;
grant execute on function public.consume_catalog_request(uuid) to service_role;
