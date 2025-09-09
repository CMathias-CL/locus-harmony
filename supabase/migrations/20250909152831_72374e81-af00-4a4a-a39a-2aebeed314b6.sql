-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Development: Allow viewing rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Development: Allow viewing courses" ON public.courses;
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Development: Allow creating reservations" ON public.reservations;

-- Create new SELECT policies that allow viewing without authentication
CREATE POLICY "Development: Allow viewing rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Development: Allow viewing courses" 
ON public.courses 
FOR SELECT 
USING (true);

-- Allow creating reservations without strict authentication for development
CREATE POLICY "Development: Allow creating reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (true);