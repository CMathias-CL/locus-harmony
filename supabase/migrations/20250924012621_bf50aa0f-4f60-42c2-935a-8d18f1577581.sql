-- Temporarily allow broader access to profiles for development
CREATE POLICY "Development: Allow viewing all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Development: Allow managing all profiles" 
ON public.profiles 
FOR ALL 
USING (true) 
WITH CHECK (true);