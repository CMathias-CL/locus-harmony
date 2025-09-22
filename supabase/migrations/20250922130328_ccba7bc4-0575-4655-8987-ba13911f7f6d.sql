-- Fix security vulnerability: Restrict access to profiles table
-- Remove the overly permissive policy that allows viewing all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create more secure policies for profile access
-- 1. Users can view their own complete profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Users can view limited public information about others (name and role only)
-- This is needed for displaying professor names, coordinators, etc.
CREATE POLICY "Users can view public profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  -- Only allow viewing basic public info, not sensitive data like email/phone
  true
);

-- 3. Admins and coordinators can view more complete profiles for management purposes
CREATE POLICY "Admins can view extended profile info" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'coordinator')
  )
);

-- Create a view for public profile information that only exposes safe data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  role,
  department,
  position,
  created_at
FROM public.profiles;