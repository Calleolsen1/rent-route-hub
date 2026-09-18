-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number text,
  company_name text,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  org_number text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text DEFAULT 'Sverige',
  billing_email text,
  billing_address text,
  notes text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_customers_email ON public.customers(email);

CREATE SEQUENCE IF NOT EXISTS public.customer_number_seq START 1000;
CREATE OR REPLACE FUNCTION public.assign_customer_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.customer_number IS NULL THEN
    NEW.customer_number := 'K-' || nextval('public.customer_number_seq')::text;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_customers_number BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.assign_customer_number();

-- ============ HOTELS ============
CREATE TABLE public.hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address_line1 text,
  postal_code text,
  city text,
  country text,
  contact_name text,
  email text,
  phone text,
  website text,
  image_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotels TO authenticated;
GRANT ALL ON public.hotels TO service_role;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage hotels" ON public.hotels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_hotels_updated_at BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BOOKINGS ============
CREATE TYPE public.booking_status AS ENUM ('draft','confirmed','paid','completed','cancelled');
CREATE TYPE public.booking_item_type AS ENUM ('hotel','flight','ticket','transfer','other');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number text,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE SET NULL,
  title text NOT NULL,
  destination text,
  depart_date date,
  return_date date,
  travellers_count integer NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'draft',
  notes text,
  internal_notes text,
  currency text NOT NULL DEFAULT 'SEK',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage bookings" ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_depart ON public.bookings(depart_date);

CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START 1;
CREATE OR REPLACE FUNCTION public.assign_booking_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'B-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.booking_number_seq')::text,4,'0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_bookings_number BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.assign_booking_number();

CREATE TABLE public.booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_type public.booking_item_type NOT NULL,
  description text NOT NULL,
  supplier text,
  qty integer NOT NULL DEFAULT 1,
  cost_sek numeric(12,2) NOT NULL DEFAULT 0,
  sale_sek numeric(12,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  -- hotel
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE SET NULL,
  check_in date,
  check_out date,
  room_type text,
  rooms integer,
  -- flight
  airline text,
  flight_number text,
  from_airport text,
  to_airport text,
  depart_at timestamptz,
  arrive_at timestamptz,
  booking_reference text,
  -- ticket / transfer
  event_name text,
  ticket_category text,
  transfer_from text,
  transfer_to text,
  transfer_at timestamptz,
  vehicle text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_items TO authenticated;
GRANT ALL ON public.booking_items TO service_role;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage booking items" ON public.booking_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_items_updated_at BEFORE UPDATE ON public.booking_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_booking_items_booking ON public.booking_items(booking_id);

CREATE TABLE public.booking_travellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  date_of_birth date,
  passport_number text,
  passport_expiry date,
  nationality text,
  email text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_travellers TO authenticated;
GRANT ALL ON public.booking_travellers TO service_role;
ALTER TABLE public.booking_travellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage travellers" ON public.booking_travellers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_booking_travellers_updated_at BEFORE UPDATE ON public.booking_travellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_travellers_booking ON public.booking_travellers(booking_id);

-- ============ INVOICES ============
CREATE TYPE public.bo_invoice_status AS ENUM ('draft','sent','partly_paid','paid','overdue','cancelled');

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status public.bo_invoice_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT current_date,
  due_date date NOT NULL DEFAULT (current_date + 30),
  vat_rate numeric(5,2) NOT NULL DEFAULT 0,
  subtotal_sek numeric(12,2) NOT NULL DEFAULT 0,
  vat_sek numeric(12,2) NOT NULL DEFAULT 0,
  total_sek numeric(12,2) NOT NULL DEFAULT 0,
  paid_sek numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'SEK',
  accounting_account text,
  reference text,
  notes text,
  sent_at timestamptz,
  paid_at timestamptz,
  exported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);

CREATE SEQUENCE IF NOT EXISTS public.bo_invoice_number_seq START 1;
CREATE OR REPLACE FUNCTION public.assign_bo_invoice_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'F-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.bo_invoice_number_seq')::text,4,'0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_invoices_number BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.assign_bo_invoice_number();

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  unit_price_sek numeric(12,2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoice items" ON public.invoice_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);

CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount_sek numeric(12,2) NOT NULL,
  paid_on date NOT NULL DEFAULT current_date,
  method text,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_payments TO authenticated;
GRANT ALL ON public.invoice_payments TO service_role;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage invoice payments" ON public.invoice_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);

-- keep invoice paid totals in sync
CREATE OR REPLACE FUNCTION public.sync_invoice_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_invoice uuid; v_paid numeric; v_total numeric;
BEGIN
  v_invoice := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(amount_sek),0) INTO v_paid FROM public.invoice_payments WHERE invoice_id = v_invoice;
  SELECT total_sek INTO v_total FROM public.invoices WHERE id = v_invoice;
  UPDATE public.invoices
     SET paid_sek = v_paid,
         paid_at = CASE WHEN v_total > 0 AND v_paid >= v_total THEN now() ELSE NULL END,
         status = CASE
           WHEN v_total > 0 AND v_paid >= v_total THEN 'paid'::public.bo_invoice_status
           WHEN v_paid > 0 THEN 'partly_paid'::public.bo_invoice_status
           ELSE status END,
         updated_at = now()
   WHERE id = v_invoice;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_invoice_payments_sync
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
FOR EACH ROW EXECUTE FUNCTION public.sync_invoice_paid();

-- ============ DOCUMENT / EMAIL LOG ============
CREATE TABLE public.booking_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  doc_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_documents TO authenticated;
GRANT ALL ON public.booking_documents TO service_role;
ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage booking documents" ON public.booking_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_booking_documents_booking ON public.booking_documents(booking_id);

-- ============ REPORT VIEWS ============
CREATE VIEW public.booking_margin_view
WITH (security_invoker = true) AS
SELECT b.id AS booking_id, b.booking_number, b.title, b.destination, b.status,
       b.depart_date, b.return_date, b.travellers_count,
       b.customer_id, c.company_name, c.contact_name,
       COALESCE(SUM(bi.sale_sek * bi.qty),0) AS sale_total_sek,
       COALESCE(SUM(bi.cost_sek * bi.qty),0) AS cost_total_sek,
       COALESCE(SUM(bi.sale_sek * bi.qty),0) - COALESCE(SUM(bi.cost_sek * bi.qty),0) AS margin_sek
FROM public.bookings b
JOIN public.customers c ON c.id = b.customer_id
LEFT JOIN public.booking_items bi ON bi.booking_id = b.id
GROUP BY b.id, c.company_name, c.contact_name;
GRANT SELECT ON public.booking_margin_view TO authenticated, service_role;

CREATE VIEW public.upcoming_departures_view
WITH (security_invoker = true) AS
SELECT b.id AS booking_id, b.booking_number, b.title, b.destination, b.status,
       b.depart_date, b.return_date, b.travellers_count,
       c.company_name, c.contact_name, c.email, c.phone
FROM public.bookings b
JOIN public.customers c ON c.id = b.customer_id
WHERE b.depart_date >= current_date AND b.status <> 'cancelled';
GRANT SELECT ON public.upcoming_departures_view TO authenticated, service_role;

CREATE VIEW public.sales_forecast_view
WITH (security_invoker = true) AS
SELECT date_trunc('month', b.depart_date)::date AS month,
       b.destination,
       COUNT(DISTINCT b.id) AS bookings_count,
       COALESCE(SUM(bi.sale_sek * bi.qty),0) AS sale_total_sek,
       COALESCE(SUM(bi.cost_sek * bi.qty),0) AS cost_total_sek,
       COALESCE(SUM(bi.sale_sek * bi.qty),0) - COALESCE(SUM(bi.cost_sek * bi.qty),0) AS margin_sek
FROM public.bookings b
LEFT JOIN public.booking_items bi ON bi.booking_id = b.id
WHERE b.depart_date IS NOT NULL AND b.status <> 'cancelled'
GROUP BY 1, 2;
GRANT SELECT ON public.sales_forecast_view TO authenticated, service_role;