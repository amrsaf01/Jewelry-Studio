-- 1. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts (clean slate for admin policies)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
-- Also drop generic policies if they conflict, but usually we keep "Users can view own"
-- We will create a comprehensive policy:

-- 4. Create Policy: Admins can view ALL, Users can view OWN
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_admin() OR auth.uid() = id
);

-- 5. Create Policy: Admins can update ALL, Users can update OWN
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  is_admin() OR auth.uid() = id
);

-- 6. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
