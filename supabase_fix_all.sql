-- 1. Ensure the 'logos' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

-- 2. Drop existing policies to avoid conflicts (clean slate for storage)
drop policy if exists "Public Access to Logos" on storage.objects;
drop policy if exists "Public Upload Access" on storage.objects;
drop policy if exists "Public Update Access" on storage.objects;
drop policy if exists "Authenticated Upload Access" on storage.objects;
drop policy if exists "Authenticated Update Access" on storage.objects;

-- 3. Re-create Storage Policies

-- Allow PUBLIC to VIEW logos (essential for the site to work)
create policy "Public Access to Logos"
on storage.objects for select
to public
using ( bucket_id = 'logos' );

-- Allow AUTHENTICATED users to UPLOAD logos
create policy "Authenticated Upload Access"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'logos' );

-- Allow AUTHENTICATED users to UPDATE their own logos (or all logos for now to be safe)
create policy "Authenticated Update Access"
on storage.objects for update
to authenticated
using ( bucket_id = 'logos' );

-- 4. Ensure Profiles RLS is correct (just in case)
alter table public.profiles enable row level security;

-- (Re-run these just to be sure, using 'if not exists' logic is hard in SQL for policies, 
-- so we assume the previous script ran. If not, these might error, which is fine if they exist.)
-- But to be safe, let's just print a message or rely on the previous fix.
-- We will assume profiles policies are good from the previous step.

