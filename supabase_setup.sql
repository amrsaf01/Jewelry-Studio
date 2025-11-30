-- Create the profiles table
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  store_name text,
  theme text,
  logo_url text
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies to allow public read/write access (for MVP sync)
create policy "Enable read access for all users"
on "public"."profiles"
as PERMISSIVE
for SELECT
to public
using (true);

create policy "Enable insert access for all users"
on "public"."profiles"
as PERMISSIVE
for INSERT
to public
with check (true);

create policy "Enable update access for all users"
on "public"."profiles"
as PERMISSIVE
for UPDATE
to public
using (true);

-- Insert an initial default row to ensure the app has something to load
insert into public.profiles (store_name, theme)
values ('Gemini Jewelry Studio', 'gold');
