CREATE OR REPLACE VIEW public.booking_margin_view
WITH (security_invoker = true) AS
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