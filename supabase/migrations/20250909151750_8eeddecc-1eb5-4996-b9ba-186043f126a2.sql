-- Add policies for UPDATE and DELETE operations on academic periods
CREATE POLICY "Development: Allow academic period updates" 
ON public.academic_periods 
FOR UPDATE 
USING (true);

CREATE POLICY "Development: Allow academic period deletion" 
ON public.academic_periods 
FOR DELETE 
USING (true);