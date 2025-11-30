-- 1. Add the flexible config column to store all settings
alter table public.profiles
add column if not exists config jsonb;

-- 2. Create the storage bucket for logos
-- We use 'on conflict' to avoid errors if you run this twice
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- 3. Set up Security Policies for the 'logos' bucket

-- Allow anyone to VIEW logos (so they load on the public site)
create policy "Public Access to Logos"
on storage.objects for select
to public
using ( bucket_id = 'logos' );

-- Allow anyone to UPLOAD logos (for this MVP phase)
-- In the future, we will change 'to public' to 'to authenticated'
create policy "Public Upload Access"
on storage.objects for insert
to public
with check ( bucket_id = 'logos' );

-- Allow updates to existing logos
create policy "Public Update Access"
on storage.objects for update
to public
using ( bucket_id = 'logos' );
