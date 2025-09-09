-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  category TEXT NOT NULL DEFAULT 'reservation', -- reservation, system, course
  related_id UUID, -- reservation_id, course_id, etc.
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notifications for reservation events
CREATE OR REPLACE FUNCTION public.notify_reservation_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_record RECORD;
  enrollment_record RECORD;
  creator_profile RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get creator profile
  SELECT full_name, email INTO creator_profile
  FROM profiles WHERE id = COALESCE(NEW.created_by, OLD.created_by);

  -- Determine notification content based on operation
  IF TG_OP = 'INSERT' THEN
    notification_title := 'Nueva Reserva Creada';
    notification_message := format('Se ha creado una nueva reserva: "%s" por %s', 
                                 NEW.title, creator_profile.full_name);
  ELSIF TG_OP = 'UPDATE' THEN
    notification_title := 'Reserva Modificada';
    notification_message := format('La reserva "%s" ha sido modificada por %s', 
                                 NEW.title, creator_profile.full_name);
  ELSIF TG_OP = 'DELETE' THEN
    notification_title := 'Reserva Cancelada';
    notification_message := format('La reserva "%s" ha sido cancelada por %s', 
                                 OLD.title, creator_profile.full_name);
  END IF;

  -- If reservation has a course, notify enrolled students and professor
  IF COALESCE(NEW.course_id, OLD.course_id) IS NOT NULL THEN
    -- Get course information
    SELECT c.*, p.full_name as professor_name, p.id as professor_id
    INTO course_record
    FROM courses c
    LEFT JOIN profiles p ON c.professor_id = p.id
    WHERE c.id = COALESCE(NEW.course_id, OLD.course_id);

    -- Notify professor if exists and is not the creator
    IF course_record.professor_id IS NOT NULL AND 
       course_record.professor_id != COALESCE(NEW.created_by, OLD.created_by) THEN
      INSERT INTO notifications (user_id, title, message, type, category, related_id)
      VALUES (course_record.professor_id, notification_title, 
              notification_message || format(' para el curso %s', course_record.name),
              'info', 'reservation', COALESCE(NEW.id, OLD.id));
    END IF;

    -- Notify enrolled students
    FOR enrollment_record IN
      SELECT student_id FROM course_enrollments 
      WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
      AND student_id != COALESCE(NEW.created_by, OLD.created_by)
    LOOP
      INSERT INTO notifications (user_id, title, message, type, category, related_id)
      VALUES (enrollment_record.student_id, notification_title,
              notification_message || format(' para el curso %s', course_record.name),
              'info', 'reservation', COALESCE(NEW.id, OLD.id));
    END LOOP;
  END IF;

  -- Notify coordinators and admins (except creator)
  INSERT INTO notifications (user_id, title, message, type, category, related_id)
  SELECT p.id, notification_title, notification_message, 'info', 'reservation', COALESCE(NEW.id, OLD.id)
  FROM profiles p
  WHERE p.role IN ('admin', 'coordinator')
  AND p.id != COALESCE(NEW.created_by, OLD.created_by);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for reservation notifications
CREATE TRIGGER reservation_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reservation_event();

-- Function to send email notifications (to be called from edge function)
CREATE OR REPLACE FUNCTION public.get_notification_recipients(reservation_id UUID)
RETURNS TABLE (
  email TEXT,
  full_name TEXT,
  role user_role,
  notification_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reservation_record RECORD;
  course_record RECORD;
BEGIN
  -- Get reservation details
  SELECT r.*, p.full_name as creator_name, p.email as creator_email
  INTO reservation_record
  FROM reservations r
  LEFT JOIN profiles p ON r.created_by = p.id
  WHERE r.id = reservation_id;

  -- If reservation has a course, return course participants
  IF reservation_record.course_id IS NOT NULL THEN
    -- Get course details
    SELECT c.*, p.full_name as professor_name, p.email as professor_email
    INTO course_record
    FROM courses c
    LEFT JOIN profiles p ON c.professor_id = p.id
    WHERE c.id = reservation_record.course_id;

    -- Return professor
    IF course_record.professor_email IS NOT NULL AND 
       course_record.professor_email != reservation_record.creator_email THEN
      RETURN QUERY SELECT 
        course_record.professor_email,
        course_record.professor_name,
        'professor'::user_role,
        'course_reservation'::TEXT;
    END IF;

    -- Return enrolled students
    RETURN QUERY SELECT 
      p.email,
      p.full_name,
      p.role,
      'course_reservation'::TEXT
    FROM course_enrollments ce
    JOIN profiles p ON ce.student_id = p.id
    WHERE ce.course_id = reservation_record.course_id
    AND p.email != reservation_record.creator_email;
  END IF;

  -- Return coordinators and admins
  RETURN QUERY SELECT 
    p.email,
    p.full_name,
    p.role,
    'admin_notification'::TEXT
  FROM profiles p
  WHERE p.role IN ('admin', 'coordinator')
  AND p.email != reservation_record.creator_email;
END;
$$;