ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
