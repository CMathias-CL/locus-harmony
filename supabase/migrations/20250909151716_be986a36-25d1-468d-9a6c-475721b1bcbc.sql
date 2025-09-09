-- Create a development policy for academic periods similar to profiles
-- Allow inserting academic periods without authentication restrictions

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Only admins can manage academic periods" ON public.academic_periods;

-- Create a development-friendly policy
CREATE POLICY "Development: Allow academic period creation" 
ON public.academic_periods 
FOR INSERT 
WITH CHECK (true);

-- Keep the select policy for viewing
-- The existing select policy should remain unchanged