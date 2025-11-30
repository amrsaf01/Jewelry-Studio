-- 1. Create the function that handles new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, permissions, created_at, store_name, expires_at)
  VALUES (
    new.id,
    new.email,
    'user', -- Default role
    '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb,
    now(),
    'New Jewelry Store', -- Default store name
    (new.raw_user_meta_data->>'expires_at')::timestamptz -- Extract expiration from metadata
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger (Drop first to ensure update)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
