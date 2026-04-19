create type user_role as enum (
  'super_admin',
  'brand_admin',
  'brand_member',
  'agency_partner'
);

create type asset_status as enum (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'archived'
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  business_unit text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null,
  primary_brand_id uuid references brands(id) on delete set null,
  agency_name text,
  access_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists cross_brand_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  granted_by uuid not null references profiles(id) on delete restrict,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, brand_id)
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  title text not null,
  description text,
  category text not null,
  platform text,
  product_name text,
  campaign_name text,
  version_label text not null,
  status asset_status not null default 'draft',
  storage_path text not null,
  thumbnail_path text,
  mime_type text not null,
  file_size_bytes bigint not null,
  checksum_sha256 text,
  parent_asset_id uuid references assets(id) on delete set null,
  latest_approved_version boolean not null default false,
  uploaded_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists asset_tags (
  asset_id uuid not null references assets(id) on delete cascade,
  tag text not null,
  primary key (asset_id, tag)
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  reviewed_by uuid not null references profiles(id) on delete restrict,
  action asset_status not null,
  comment text,
  created_at timestamptz not null default now(),
  constraint approvals_action_check check (action in ('approved', 'rejected'))
);

create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id) on delete cascade,
  downloaded_by uuid not null references profiles(id) on delete restrict,
  variant text not null default 'original',
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assets_brand_status_idx on assets (brand_id, status);
create index if not exists assets_title_search_idx on assets using gin (to_tsvector('simple', title || ' ' || coalesce(description, '')));
create index if not exists asset_tags_tag_idx on asset_tags (tag);
