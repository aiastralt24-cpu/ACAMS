insert into brands (slug, name, business_unit, description)
values
  ('astral-pipes', 'Astral Pipes', 'Pipes Division', 'Central library for pipes creatives, packshots, trade assets, and campaign executions.'),
  ('astral-adhesives', 'Astral Adhesives', 'Adhesives Division', 'Bondtite and adhesives workspace for social, launch, and product content.'),
  ('astral-bathware', 'Astral Bathware', 'Bathware Division', 'Lifestyle imagery, retail collateral, and product-focused bathware assets.'),
  ('astral-paints', 'Astral Paints', 'Paints Division', 'Esteema and Gem brand content, campaign creatives, and shade assets.'),
  ('astral-foundation', 'Astral Foundation', 'CSR / Conservation', 'CSR events, conservation stories, and foundation reports.'),
  ('astral-limited', 'Astral Limited', 'Corporate', 'Corporate presentations, annual-report assets, and investor-facing collateral.')
on conflict (slug) do nothing;

-- After creating the first auth user in Supabase Auth, create the first Super Admin profile:
-- insert into profiles (id, email, full_name, role, is_active)
-- values ('<auth-user-id>', 'superadmin@astral.in', 'Super Admin', 'super_admin', true);
