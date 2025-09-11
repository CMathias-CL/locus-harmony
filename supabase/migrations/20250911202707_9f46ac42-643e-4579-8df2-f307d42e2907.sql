-- Development RLS relaxations to make app functional without auth

-- Faculties: allow SELECT in development
CREATE POLICY "Development: Allow viewing faculties"
ON public.faculties
FOR SELECT
USING (true);

-- Rooms: allow full management in development
CREATE POLICY "Development: Allow viewing rooms"
ON public.rooms
FOR SELECT
USING (true);

CREATE POLICY "Development: Allow creating rooms"
ON public.rooms
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Development: Allow updating rooms"
ON public.rooms
FOR UPDATE
USING (true);

CREATE POLICY "Development: Allow deleting rooms"
ON public.rooms
FOR DELETE
USING (true);

-- Buildings: allow viewing in development
CREATE POLICY "Development: Allow viewing buildings"
ON public.buildings
FOR SELECT
USING (true);

-- Reservations: allow viewing in development
CREATE POLICY "Development: Allow viewing reservations"
ON public.reservations
FOR SELECT
USING (true);

-- Cleaning reports: allow viewing and managing in development
CREATE POLICY "Development: Allow viewing cleaning reports"
ON public.cleaning_reports
FOR SELECT
USING (true);

CREATE POLICY "Development: Allow managing cleaning reports"
ON public.cleaning_reports
FOR ALL
USING (true)
WITH CHECK (true);

-- Cleaning observation types: allow viewing in development
CREATE POLICY "Development: Allow viewing observation types"
ON public.cleaning_observation_types
FOR SELECT
USING (true);
