-- Create a development user profile if it doesn't exist
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'dev@example.com', 'Usuario de Desarrollo', 'admin')
ON CONFLICT (id) DO NOTHING;