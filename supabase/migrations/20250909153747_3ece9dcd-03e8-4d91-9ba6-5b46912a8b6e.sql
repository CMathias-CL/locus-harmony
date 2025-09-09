-- Drop all existing policies for courses
DROP POLICY IF EXISTS "Professors can manage their courses" ON public.courses;
DROP POLICY IF EXISTS "Development: Allow viewing courses" ON public.courses;
DROP POLICY IF EXISTS "Development: Allow creating courses" ON public.courses;
DROP POLICY IF EXISTS "Development: Allow updating courses" ON public.courses;
DROP POLICY IF EXISTS "Development: Allow deleting courses" ON public.courses;

-- Create development policies for courses
CREATE POLICY "Development: Allow viewing courses" 
ON public.courses 
FOR SELECT 
USING (true);

CREATE POLICY "Development: Allow creating courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Development: Allow updating courses" 
ON public.courses 
FOR UPDATE 
USING (true);

CREATE POLICY "Development: Allow deleting courses" 
ON public.courses 
FOR DELETE 
USING (true);