-- Comprehensive Fix for Missing Users and Permissions

-- 1. Ensure the profiles table has all necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Drop and Recreate the Trigger Function (to ensure it handles metadata correctly)
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
  SET email = EXCLUDED.email; -- Update email if it changed
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Fix RLS Policies (Ensure Admins can see everything)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do EVERYTHING
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
CREATE POLICY "Admins can do everything"
ON public.profiles
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Users can see their own profile
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
CREATE POLICY "Users can see own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own config/store_name
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 5. BACKFILL: Create profiles for any users that exist in auth.users but NOT in profiles
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

-- 6. Verify Admin Role (Ensure YOU are an admin)
-- Replace this ID with your actual User ID if needed, or rely on existing admin
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@gmail.com';
