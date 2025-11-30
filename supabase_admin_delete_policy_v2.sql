-- Allow Admins to DELETE profiles (Robust Version)

-- 1. Drop the policy if it already exists to avoid errors
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 2. Re-create the policy
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  is_admin()
);
