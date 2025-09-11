-- Create cleaning reports table
CREATE TABLE public.cleaning_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  cleaning_date DATE NOT NULL,
  is_cleaned BOOLEAN DEFAULT false,
  cleaned_by TEXT,
  cleaned_at TIMESTAMP WITH TIME ZONE,
  observations JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, cleaning_date)
);

-- Create cleaning observation types
CREATE TABLE public.cleaning_observation_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default observation types
INSERT INTO public.cleaning_observation_types (name, description, category) VALUES
('Luz no funciona', 'Una o más luces del aula no están funcionando', 'electrical'),
('Proyector defectuoso', 'El proyector no funciona correctamente', 'equipment'),
('Silla en mal estado', 'Silla rota o dañada que necesita reparación', 'furniture'),
('Mesa dañada', 'Mesa con daños que requiere reparación', 'furniture'),
('Pizarra sucia', 'Pizarra que necesita limpieza especial', 'cleaning'),
('Ventana rota', 'Ventana con vidrio roto o marco dañado', 'infrastructure'),
('Aire acondicionado defectuoso', 'Sistema de climatización no funciona', 'equipment'),
('Suciedad excesiva', 'Área que requiere limpieza profunda', 'cleaning'),
('Olor desagradable', 'Presencia de malos olores en el ambiente', 'cleaning'),
('Daño en pintura', 'Paredes con pintura descascarada o manchada', 'infrastructure');

-- Enable RLS
ALTER TABLE public.cleaning_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_observation_types ENABLE ROW LEVEL SECURITY;

-- Create policies for cleaning reports
CREATE POLICY "Anyone can view cleaning reports" 
ON public.cleaning_reports 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage cleaning reports" 
ON public.cleaning_reports 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'coordinator')
));

-- Create policies for observation types
CREATE POLICY "Anyone can view observation types" 
ON public.cleaning_observation_types 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage observation types" 
ON public.cleaning_observation_types 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Add trigger for updated_at
CREATE TRIGGER update_cleaning_reports_updated_at
  BEFORE UPDATE ON public.cleaning_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();