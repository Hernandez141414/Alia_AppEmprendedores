create table if not exists public.creation_drafts (
  id uuid primary key default gen_random_uuid(),
  selected_description text not null,
  notes text not null default '',
  image_mode text not null check (image_mode in ('original', 'enhanced')),
  has_audio boolean not null default false,
  image_name text,
  created_at timestamptz not null default now()
);

alter table public.creation_drafts enable row level security;

drop policy if exists "Allow service role full access on creation_drafts"
on public.creation_drafts;

create policy "Allow service role full access on creation_drafts"
on public.creation_drafts
for all
to service_role
using (true)
with check (true);
