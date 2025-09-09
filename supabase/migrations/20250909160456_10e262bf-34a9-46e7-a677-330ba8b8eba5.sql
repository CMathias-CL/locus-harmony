-- Insert sample courses for testing
INSERT INTO public.courses (name, code, department, professor_id, academic_period_id, credits, max_students, description) VALUES
  ('Matemáticas I', 'MAT-101', 'Matemáticas', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 4, 35, 'Curso introductorio de matemáticas básicas'),
  ('Física General', 'FIS-201', 'Física', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 4, 30, 'Principios fundamentales de la física'),
  ('Programación I', 'PRG-101', 'Informática', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 3, 25, 'Introducción a la programación'),
  ('Cálculo Diferencial', 'CAL-301', 'Matemáticas', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 4, 30, 'Fundamentos del cálculo diferencial'),
  ('Química Orgánica', 'QUI-202', 'Química', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 3, 20, 'Estudio de compuestos orgánicos'),
  ('Historia Universal', 'HIS-101', 'Humanidades', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 2, 40, 'Panorama de la historia mundial'),
  ('Economía Básica', 'ECO-101', 'Economía', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 3, 35, 'Principios fundamentales de economía'),
  ('Inglés I', 'ING-101', 'Idiomas', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 2, 25, 'Nivel básico de inglés'),
  ('Estadística', 'EST-201', 'Matemáticas', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 3, 30, 'Análisis estadístico básico'),
  ('Biología General', 'BIO-101', 'Biología', NULL, (SELECT id FROM academic_periods WHERE is_active = true LIMIT 1), 4, 28, 'Fundamentos de la biología');