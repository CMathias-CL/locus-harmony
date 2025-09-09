-- Drop the restrictive SELECT policies for rooms and courses
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;

-- Create new SELECT policies that allow viewing without authentication
CREATE POLICY "Development: Allow viewing rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Development: Allow viewing courses" 
ON public.courses 
FOR SELECT 
USING (true);

-- Also update reservations to allow creation without strict authentication for development
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;

CREATE POLICY "Development: Allow creating reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (true);