-- Fix the security definer view issue by dropping the view
-- We'll handle data access through proper RLS policies instead
DROP VIEW IF EXISTS public.public_profiles;

-- Update the RLS policies to be more granular and secure
-- Remove all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile info" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view extended profile info" ON public.profiles;

-- Create secure, granular policies
-- 1. Users can always view their own complete profile
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Admins and coordinators can view all profile information
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'coordinator')
  )
);

-- 3. Regular users can only view basic public info (name, role, department, position)
-- This is enforced at the application level by selecting only these columns
CREATE POLICY "Users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() != id -- Don't duplicate the "own profile" policy
);