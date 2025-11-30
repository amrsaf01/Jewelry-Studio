-- 1. Create the function that handles new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, permissions, created_at, store_name)
  VALUES (
    new.id,
    new.email,
    'user', -- Default role
    '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb,
    now(),
    'New Jewelry Store' -- Default store name
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill: Create profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, role, permissions, created_at, store_name)
SELECT 
  id, 
  email, 
  'user', 
  '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb,
  created_at,
  'New Jewelry Store'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
