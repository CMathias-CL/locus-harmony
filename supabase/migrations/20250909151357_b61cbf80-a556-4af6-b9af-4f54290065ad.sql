-- Drop the foreign key constraint that links profiles.id to auth.users.id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make the id field auto-generate UUID if not provided  
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();