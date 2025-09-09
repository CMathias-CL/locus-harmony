-- Add missing fields to profiles table for professor management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS degree TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_hours_per_week INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_days INTEGER[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS competencies JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update academic periods enum to include 'annual' type
ALTER TYPE period_type ADD VALUE IF NOT EXISTS 'annual';

-- Add missing fields to academic_periods table
ALTER TABLE public.academic_periods ADD COLUMN IF NOT EXISTS enrollment_start DATE;
ALTER TABLE public.academic_periods ADD COLUMN IF NOT EXISTS enrollment_end DATE;
ALTER TABLE public.academic_periods ADD COLUMN IF NOT EXISTS max_courses_per_student INTEGER;
ALTER TABLE public.academic_periods ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false;
ALTER TABLE public.academic_periods ADD COLUMN IF NOT EXISTS description TEXT;