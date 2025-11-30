-- CLEANUP: Remove insecure/duplicate policies
-- We only want the specific "Admins can..." and "Users can..." policies.

DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.profiles;

-- Verify what's left
SELECT * FROM pg_policies WHERE tablename = 'profiles';
