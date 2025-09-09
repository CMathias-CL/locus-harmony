-- Drop the current insert policy
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;

-- Create a temporary policy that allows inserting professor profiles without authentication
-- This is for development purposes - in production you should implement proper authentication
CREATE POLICY "Allow professor profile creation" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = id OR  -- Users can create their own profile (when authenticated)
  role = 'professor'  -- Allow creating professor profiles without authentication (temporary)
);

-- Keep existing policies for other operations
-- Users can still view all profiles and update their own profiles