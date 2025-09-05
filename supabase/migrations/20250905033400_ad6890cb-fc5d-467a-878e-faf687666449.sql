-- Create enums for better type safety
CREATE TYPE public.academic_period_type AS ENUM ('semester', 'trimester', 'quarter', 'module');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.user_role AS ENUM ('admin', 'coordinator', 'professor', 'student');
CREATE TYPE public.room_status AS ENUM ('available', 'occupied', 'maintenance', 'blocked');
CREATE TYPE public.event_type AS ENUM ('class', 'lab', 'seminar', 'exam', 'meeting', 'maintenance', 'event');

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Academic periods (semesters, trimesters, etc.)
CREATE TABLE public.academic_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  period_type academic_period_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Buildings
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  floor_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Rooms/Spaces
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  floor INTEGER DEFAULT 1,
  room_type TEXT, -- classroom, lab, auditorium, office
  features JSONB DEFAULT '[]', -- ["projector", "computers", "whiteboard", "accessibility"]
  status room_status DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  credits INTEGER DEFAULT 3,
  academic_period_id UUID REFERENCES public.academic_periods(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.profiles(id),
  max_students INTEGER DEFAULT 30,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Course enrollments
CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Schedule templates (recurring schedules)
CREATE TABLE public.schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  event_type event_type DEFAULT 'class',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Reservations/Bookings
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id),
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type event_type DEFAULT 'class',
  status reservation_status DEFAULT 'pending',
  attendee_count INTEGER DEFAULT 0,
  equipment_needed JSONB DEFAULT '[]',
  notes TEXT,
  recurring_template_id UUID REFERENCES public.schedule_templates(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_datetime_range CHECK (start_datetime < end_datetime)
);

-- Room availability blocks (for maintenance, events, etc.)
CREATE TABLE public.room_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reason TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  block_type TEXT DEFAULT 'maintenance', -- maintenance, event, cleaning, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_block_datetime_range CHECK (start_datetime < end_datetime)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Academic periods - readable by all authenticated users
CREATE POLICY "Anyone can view academic periods" ON public.academic_periods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can manage academic periods" ON public.academic_periods FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Buildings - readable by all
CREATE POLICY "Anyone can view buildings" ON public.buildings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can manage buildings" ON public.buildings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Rooms - readable by all
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can manage rooms" ON public.rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Courses policies
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Professors can manage their courses" ON public.courses FOR ALL USING (
  professor_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
);

-- Course enrollments
CREATE POLICY "Students can view their enrollments" ON public.course_enrollments FOR SELECT USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'professor'))
);
CREATE POLICY "Admins and coordinators can manage enrollments" ON public.course_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
);

-- Schedule templates
CREATE POLICY "Anyone can view schedule templates" ON public.schedule_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Professors and admins can manage templates" ON public.schedule_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.courses c 
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.id = schedule_templates.course_id 
    AND (c.professor_id = auth.uid() OR p.role IN ('admin', 'coordinator'))
  )
);

-- Reservations policies
CREATE POLICY "Users can view reservations" ON public.reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their reservations" ON public.reservations FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
);
CREATE POLICY "Users can delete their reservations" ON public.reservations FOR DELETE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
);

-- Room blocks policies
CREATE POLICY "Anyone can view room blocks" ON public.room_blocks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage room blocks" ON public.room_blocks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
);

-- Create indexes for better performance
CREATE INDEX idx_reservations_room_datetime ON public.reservations(room_id, start_datetime, end_datetime);
CREATE INDEX idx_reservations_created_by ON public.reservations(created_by);
CREATE INDEX idx_reservations_course ON public.reservations(course_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_schedule_templates_course ON public.schedule_templates(course_id);
CREATE INDEX idx_schedule_templates_room ON public.schedule_templates(room_id);
CREATE INDEX idx_schedule_templates_day_time ON public.schedule_templates(day_of_week, start_time);
CREATE INDEX idx_room_blocks_room_datetime ON public.room_blocks(room_id, start_datetime, end_datetime);
CREATE INDEX idx_course_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course ON public.course_enrollments(course_id);

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_academic_periods_updated_at BEFORE UPDATE ON public.academic_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_schedule_templates_updated_at BEFORE UPDATE ON public.schedule_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_room_blocks_updated_at BEFORE UPDATE ON public.room_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();