REVOKE EXECUTE ON FUNCTION public.complete_past_bookings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_past_bookings() FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_past_bookings() TO authenticated;