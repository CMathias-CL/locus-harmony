-- Add professor position field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT;

-- Update RLS policies to allow admins to create professor profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new policy for profile insertion
CREATE POLICY "Users can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = id OR  -- Users can create their own profile
  EXISTS (  -- Or admins can create any profile
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordinator')
  )
);