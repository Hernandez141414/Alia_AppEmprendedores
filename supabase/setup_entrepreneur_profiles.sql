create table if not exists public.entrepreneur_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  business_description text not null default '',
  business_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.entrepreneur_profiles enable row level security;

drop policy if exists "Allow service role full access on entrepreneur_profiles"
on public.entrepreneur_profiles;

create policy "Allow service role full access on entrepreneur_profiles"
on public.entrepreneur_profiles
for all
to service_role
using (true)
with check (true);
