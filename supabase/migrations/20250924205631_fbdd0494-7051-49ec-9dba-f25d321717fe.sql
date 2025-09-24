-- Add color field to faculties table
ALTER TABLE public.faculties 
ADD COLUMN color TEXT DEFAULT '#3B82F6';

-- Create a temporary function to assign colors to existing faculties
CREATE OR REPLACE FUNCTION assign_faculty_colors()
RETURNS void AS $$
DECLARE
  faculty_record RECORD;
  color_index INTEGER := 0;
  colors TEXT[] := ARRAY['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];
BEGIN
  FOR faculty_record IN 
    SELECT id FROM public.faculties ORDER BY created_at
  LOOP
    UPDATE public.faculties 
    SET color = colors[(color_index % array_length(colors, 1)) + 1]
    WHERE id = faculty_record.id;
    
    color_index := color_index + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to assign colors
SELECT assign_faculty_colors();

-- Drop the temporary function
DROP FUNCTION assign_faculty_colors();