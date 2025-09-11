-- Fix the RLS policy for faculties to properly handle INSERT operations
DROP POLICY IF EXISTS "Admins can manage faculties" ON public.faculties;

-- Create separate policies for different operations
CREATE POLICY "Admins can view faculties" 
ON public.faculties 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert faculties" 
ON public.faculties 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'coordinator')
));

CREATE POLICY "Admins can update faculties" 
ON public.faculties 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'coordinator')
));

CREATE POLICY "Admins can delete faculties" 
ON public.faculties 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'coordinator')
));