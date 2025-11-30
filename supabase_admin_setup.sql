-- Add Role and Permissions to Profiles
-- Run this in Supabase SQL Editor

-- 1. Add columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb;

-- 2. Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies
-- Allow admins to read ALL profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR is_admin()
);

-- Allow admins to update ALL profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR is_admin()
);

-- 4. Set the current user (YOU) as Admin
-- REPLACE 'YOUR_USER_ID' with your actual ID if you know it, 
-- otherwise run this after logging in and finding your ID.
-- For now, we'll just leave this commented out or generic.
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
