-- Add missing admin SELECT policy for trips table
CREATE POLICY "Admins can view all trips"
ON public.trips
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));