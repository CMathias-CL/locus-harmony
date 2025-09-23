-- Create enums for modules and permissions
CREATE TYPE public.system_module AS ENUM (
  'reservations',
  'rooms', 
  'courses',
  'professors',
  'academic_periods',
  'faculties',
  'cleaning_reports',
  'users'
);

CREATE TYPE public.permission_action AS ENUM (
  'view',
  'create', 
  'edit',
  'delete',
  'manage_all'
);

-- Create user permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module system_module NOT NULL,
  action permission_action NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module, action)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_permissions
CREATE POLICY "Admins can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Coordinators can view permissions" 
ON public.user_permissions 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'coordinator'));

-- Create function to check user module permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _user_id UUID,
  _module system_module,
  _action permission_action
)
RETURNS BOOLEAN AS $$
DECLARE
  user_profile RECORD;
  has_permission BOOLEAN := false;
BEGIN
  -- Get user profile
  SELECT role INTO user_profile FROM profiles WHERE id = _user_id;
  
  -- Admins have all permissions
  IF user_profile.role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Check specific permission
  SELECT granted INTO has_permission
  FROM user_permissions 
  WHERE user_id = _user_id 
    AND module = _module 
    AND action = _action;
  
  -- Check manage_all permission for the module
  IF NOT COALESCE(has_permission, false) THEN
    SELECT granted INTO has_permission
    FROM user_permissions 
    WHERE user_id = _user_id 
      AND module = _module 
      AND action = 'manage_all';
  END IF;
  
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create trigger for updated_at
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();