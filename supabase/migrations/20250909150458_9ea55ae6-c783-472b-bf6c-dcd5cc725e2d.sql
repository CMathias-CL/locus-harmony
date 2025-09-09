-- Create security definer function to get current user role (prevents recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop the problematic policy and recreate it properly
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;

-- Create new policy using the security definer function
CREATE POLICY "Users can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = id OR  -- Users can create their own profile
  public.get_current_user_role() IN ('admin', 'coordinator')  -- Or admins can create any profile
);

-- Enable RLS on any tables that might not have it enabled
-- (The tables should already have RLS enabled based on the schema, but let's make sure)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.room_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedule_templates ENABLE ROW LEVEL SECURITY;