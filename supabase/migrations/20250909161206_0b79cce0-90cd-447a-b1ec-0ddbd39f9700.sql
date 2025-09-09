-- Remove the foreign key constraint for recurring_template_id since we're using it just as a grouping identifier
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_recurring_template_id_fkey;

-- Make recurring_template_id nullable and remove any default constraint
ALTER TABLE public.reservations ALTER COLUMN recurring_template_id DROP NOT NULL;