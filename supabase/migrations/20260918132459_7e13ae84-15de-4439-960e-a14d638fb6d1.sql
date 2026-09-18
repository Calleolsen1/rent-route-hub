CREATE OR REPLACE FUNCTION public.complete_past_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.bookings
     SET status = 'completed', updated_at = now()
   WHERE status NOT IN ('completed', 'cancelled')
     AND COALESCE(return_date, depart_date) IS NOT NULL
     AND COALESCE(return_date, depart_date) < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.invoices
     SET status = 'overdue', updated_at = now()
   WHERE status IN ('sent', 'partly_paid')
     AND due_date < CURRENT_DATE;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_past_bookings() TO authenticated;