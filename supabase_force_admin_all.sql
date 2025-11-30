-- 1. Ensure columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{"can_use_photo": true, "can_use_video": true, "max_credits": 10}'::jsonb;

-- 2. Force ALL users to be admins
UPDATE public.profiles
SET role = 'admin';

-- 3. Verify the result (Removed 'email' as it might not exist yet)
SELECT id, role FROM public.profiles;
