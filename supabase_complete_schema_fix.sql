-- Complete Schema Fix for Profiles Table

-- 1. Add all missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS config JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Update the Trigger Function to include email and other fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, permissions, created_at, store_name, expires_at)
  VALUES (
    new.id,
    new.email,
    'user',
    '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb,
    now(),
    'New Jewelry Store',
    (new.raw_user_meta_data->>'expires_at')::timestamptz
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; -- Keep email in sync
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. BACKFILL: Update existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;

-- 5. BACKFILL: Create missing profiles
INSERT INTO public.profiles (id, email, role, permissions, created_at, store_name, expires_at)
SELECT 
  id, 
  email, 
  'user', 
  '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb,
  created_at, 
  'Backfilled User',
  (raw_user_meta_data->>'expires_at')::timestamptz
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
