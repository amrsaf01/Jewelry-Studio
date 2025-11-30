-- Add Expiration Column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT NULL;

-- Comment: NULL means permanent access. A date means access expires at that time.
