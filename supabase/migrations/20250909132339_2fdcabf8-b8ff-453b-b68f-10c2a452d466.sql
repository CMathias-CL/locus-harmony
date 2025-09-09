-- Temporarily allow public access to rooms table for testing
DROP POLICY "Allow authenticated users to manage rooms" ON public.rooms;

CREATE POLICY "Allow public access to rooms" 
ON public.rooms 
FOR ALL 
USING (true)
WITH CHECK (true);