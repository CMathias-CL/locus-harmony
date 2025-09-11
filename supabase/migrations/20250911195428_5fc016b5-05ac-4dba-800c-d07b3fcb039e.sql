-- Create faculties table
CREATE TABLE public.faculties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  campus TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on faculties
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;

-- Add faculty_id to rooms table
ALTER TABLE public.rooms ADD COLUMN faculty_id UUID REFERENCES public.faculties(id);

-- Add faculty_permissions to profiles table (JSON array of faculty IDs user can manage)
ALTER TABLE public.profiles ADD COLUMN faculty_permissions JSONB DEFAULT '[]'::jsonb;

-- Add can_manage_all_faculties boolean for super admins
ALTER TABLE public.profiles ADD COLUMN can_manage_all_faculties BOOLEAN DEFAULT false;

-- Create policies for faculties
CREATE POLICY "Anyone can view faculties" 
ON public.faculties 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage faculties" 
ON public.faculties 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'coordinator')
));

-- Update rooms policies to consider faculty permissions
DROP POLICY IF EXISTS "Allow authenticated users to manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Development: Allow viewing rooms" ON public.rooms;

CREATE POLICY "Users can view rooms" 
ON public.rooms 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage rooms based on faculty permissions" 
ON public.rooms 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND (
      p.role IN ('admin', 'coordinator') 
      AND (
        p.can_manage_all_faculties = true 
        OR rooms.faculty_id::text = ANY(SELECT jsonb_array_elements_text(p.faculty_permissions))
        OR rooms.faculty_id IS NULL
      )
    )
  )
);

-- Create trigger for faculties updated_at
CREATE TRIGGER update_faculties_updated_at
BEFORE UPDATE ON public.faculties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample faculties
INSERT INTO public.faculties (name, code, description, campus) VALUES 
('Facultad de Ingeniería', 'ING', 'Facultad de Ingeniería y Tecnología', 'Campus Principal'),
('Facultad de Medicina', 'MED', 'Facultad de Ciencias de la Salud', 'Campus Norte'),
('Facultad de Humanidades', 'HUM', 'Facultad de Ciencias Humanas y Sociales', 'Campus Principal'),
('Facultad de Ciencias', 'CIE', 'Facultad de Ciencias Exactas y Naturales', 'Campus Sur');