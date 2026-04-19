alter table profiles enable row level security;
alter table cross_brand_grants enable row level security;
alter table assets enable row level security;
alter table asset_tags enable row level security;
alter table approvals enable row level security;
alter table downloads enable row level security;
alter table audit_log enable row level security;

create or replace function public.current_user_role()
returns user_role
language sql
stable
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.brand_visible_to_user(target_brand_id uuid)
returns boolean
language sql
stable
as $$
  select
    case
      when auth.uid() is null then false
      when target_brand_id is null then true
      when exists (
        select 1
        from profiles
        where id = auth.uid()
          and role = 'super_admin'
          and is_active = true
      ) then true
      when exists (
        select 1
        from profiles
        where id = auth.uid()
          and primary_brand_id = target_brand_id
          and is_active = true
      ) then true
      when exists (
        select 1
        from cross_brand_grants
        where user_id = auth.uid()
          and brand_id = target_brand_id
          and revoked_at is null
      ) then true
      else false
    end
$$;

create or replace function public.brand_manageable_by_user(target_brand_id uuid)
returns boolean
language sql
stable
as $$
  select
    case
      when auth.uid() is null then false
      when target_brand_id is null then exists (
        select 1
        from profiles
        where id = auth.uid()
          and role = 'super_admin'
          and is_active = true
      )
      when exists (
        select 1
        from profiles
        where id = auth.uid()
          and role = 'super_admin'
          and is_active = true
      ) then true
      when exists (
        select 1
        from profiles
        where id = auth.uid()
          and primary_brand_id = target_brand_id
          and is_active = true
      ) then true
      else false
    end
$$;

create policy "profiles_self_or_super_admin"
on profiles
for select
using (
  id = auth.uid()
  or public.current_user_role() = 'super_admin'
);

create policy "profiles_super_admin_insert"
on profiles
for insert
with check (public.current_user_role() = 'super_admin');

create policy "profiles_super_admin_update"
on profiles
for update
using (public.current_user_role() = 'super_admin')
with check (public.current_user_role() = 'super_admin');

create policy "brand_grants_self_or_super_admin"
on cross_brand_grants
for select
using (
  user_id = auth.uid()
  or public.current_user_role() = 'super_admin'
);

create policy "brand_grants_super_admin_mutation"
on cross_brand_grants
for all
using (public.current_user_role() = 'super_admin')
with check (public.current_user_role() = 'super_admin');

create policy "assets_visible_by_brand_and_status"
on assets
for select
using (
  public.brand_visible_to_user(brand_id)
  and (
    public.brand_manageable_by_user(brand_id)
    or status = 'approved'
    or uploaded_by = auth.uid()
  )
);

create policy "assets_insert_by_access_scope"
on assets
for insert
with check (
  public.current_user_role() in ('super_admin', 'brand_admin', 'brand_member', 'agency_partner')
  and public.brand_manageable_by_user(brand_id)
);

create policy "assets_update_by_admin_or_owner"
on assets
for update
using (
  public.brand_manageable_by_user(brand_id)
  or uploaded_by = auth.uid()
)
with check (
  public.brand_manageable_by_user(brand_id)
  or uploaded_by = auth.uid()
);

create policy "assets_delete_by_super_admin"
on assets
for delete
using (public.current_user_role() = 'super_admin');

create policy "asset_tags_follow_asset_visibility"
on asset_tags
for select
using (
  exists (
    select 1
    from assets
    where assets.id = asset_tags.asset_id
      and public.brand_visible_to_user(assets.brand_id)
  )
);

create policy "asset_tags_insert_with_visible_asset"
on asset_tags
for insert
with check (
  exists (
    select 1
    from assets
    where assets.id = asset_tags.asset_id
      and public.brand_manageable_by_user(assets.brand_id)
  )
);

create policy "approvals_follow_asset_visibility"
on approvals
for select
using (
  exists (
    select 1
    from assets
    where assets.id = approvals.asset_id
      and public.brand_visible_to_user(assets.brand_id)
      and (
        public.brand_manageable_by_user(assets.brand_id)
        or assets.status = 'approved'
      )
  )
);

create policy "approvals_insert_by_admins"
on approvals
for insert
with check (
  public.current_user_role() in ('super_admin', 'brand_admin')
  and exists (
    select 1
    from assets
    where assets.id = approvals.asset_id
      and public.brand_manageable_by_user(assets.brand_id)
  )
);

create policy "downloads_follow_asset_visibility"
on downloads
for select
using (
  downloaded_by = auth.uid()
  or public.current_user_role() = 'super_admin'
  or exists (
    select 1
    from assets
    where assets.id = downloads.asset_id
      and public.brand_manageable_by_user(assets.brand_id)
  )
);

create policy "downloads_insert_self"
on downloads
for insert
with check (
  downloaded_by = auth.uid()
);

create policy "audit_visible_to_scope"
on audit_log
for select
using (
  public.current_user_role() = 'super_admin'
  or user_id = auth.uid()
);

create policy "audit_insert_self_or_admin"
on audit_log
for insert
with check (
  user_id = auth.uid()
  or public.current_user_role() = 'super_admin'
);
