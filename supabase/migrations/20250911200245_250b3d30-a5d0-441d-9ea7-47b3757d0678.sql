-- Add temporary development policies to allow faculty creation without authentication
-- These should be removed when proper authentication is implemented

CREATE POLICY "Development: Allow faculty creation" 
ON public.faculties 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Development: Allow faculty updates" 
ON public.faculties 
FOR UPDATE 
USING (true);

CREATE POLICY "Development: Allow faculty deletion" 
ON public.faculties 
FOR DELETE 
USING (true);