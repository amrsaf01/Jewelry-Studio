-- Create a function to allow admins to auto-confirm users
-- This is useful if email confirmation is enabled but we want admins to create active users immediately.

CREATE OR REPLACE FUNCTION public.confirm_user_by_admin(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if the executing user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can confirm users.';
  END IF;

  -- Update auth.users to set email_confirmed_at
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
