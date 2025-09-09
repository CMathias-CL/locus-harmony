-- Drop the restrictive SELECT policy 
DROP POLICY IF EXISTS "Anyone can view academic periods" ON public.academic_periods;

-- Create a new SELECT policy that allows viewing without authentication
CREATE POLICY "Development: Allow viewing academic periods" 
ON public.academic_periods 
FOR SELECT 
USING (true);