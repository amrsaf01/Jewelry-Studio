-- Enable RLS on profiles if not already enabled
alter table public.profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ( auth.uid() = id );

-- Allow users to insert their own profile
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ( auth.uid() = id );

-- Allow users to update their own profile
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ( auth.uid() = id );

-- Allow public access for now (optional, if you want to support non-logged in users seeing a default profile)
-- create policy "Public profiles access"
-- on public.profiles for select
-- to public
-- using ( true );
