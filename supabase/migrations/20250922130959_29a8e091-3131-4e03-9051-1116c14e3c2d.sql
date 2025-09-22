-- Fix infinite recursion in profiles RLS policies
-- Remove the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic profile info" ON public.profiles;

-- Create secure policies using the existing security definer function
-- 1. Users can view their own complete profile
CREATE POLICY "Users can view own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Admins and coordinators can view all profiles using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'coordinator'));

-- 3. Regular users can view basic profile info (but not their own, that's covered by policy 1)
-- This allows viewing professor names, etc. for course assignments
CREATE POLICY "Users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  auth.uid() != id AND
  public.get_current_user_role() NOT IN ('admin', 'coordinator')
);