-- Create a function to allow admins to delete users from auth.users
-- This is required because client-side deletion only removes the profile, not the auth account.

CREATE OR REPLACE FUNCTION public.delete_user_by_admin(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete users.';
  END IF;

  -- Delete from auth.users (this should cascade to profiles if set up correctly, 
  -- but we can delete from profiles first just in case)
  DELETE FROM public.profiles WHERE id = user_id;
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
