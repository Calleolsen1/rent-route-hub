ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE OR REPLACE VIEW public.booking_margin_view AS
SELECT b.id AS booking_id,
    b.booking_number,
    b.title,
    b.destination,
    b.status,
    b.depart_date,
    b.return_date,
    b.travellers_count,
    b.customer_id,
    c.company_name,
    c.contact_name,
    COALESCE(sum((bi.sale_sek * (bi.qty)::numeric)), (0)::numeric) AS sale_total_sek,
    COALESCE(sum((bi.cost_sek * (bi.qty)::numeric)), (0)::numeric) AS cost_total_sek,
    (COALESCE(sum((bi.sale_sek * (bi.qty)::numeric)), (0)::numeric) - COALESCE(sum((bi.cost_sek * (bi.qty)::numeric)), (0)::numeric)) AS margin_sek
   FROM ((bookings b
     JOIN customers c ON ((c.id = b.customer_id)))
     LEFT JOIN booking_items bi ON ((bi.booking_id = b.id)))
  WHERE b.deleted_at IS NULL
  GROUP BY b.id, c.company_name, c.contact_name;

CREATE OR REPLACE FUNCTION public.complete_past_bookings()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.bookings
     SET status = 'completed', updated_at = now()
   WHERE status NOT IN ('completed', 'cancelled')
     AND deleted_at IS NULL
     AND COALESCE(return_date, depart_date) IS NOT NULL
     AND COALESCE(return_date, depart_date) < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.invoices
     SET status = 'overdue', updated_at = now()
   WHERE status IN ('sent', 'partly_paid')
     AND due_date < CURRENT_DATE;

  RETURN v_count;
END;
$function$;