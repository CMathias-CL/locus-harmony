-- Temporarily allow any authenticated user to manage rooms until proper auth is implemented
DROP POLICY "Only admins can manage rooms" ON public.rooms;

CREATE POLICY "Allow authenticated users to manage rooms" 
ON public.rooms 
FOR ALL 
USING (auth.role() = 'authenticated')