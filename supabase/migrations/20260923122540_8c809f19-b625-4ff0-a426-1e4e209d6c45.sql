GRANT SELECT, INSERT, UPDATE, DELETE ON public.tc_product_links TO authenticated;
GRANT ALL ON public.tc_product_links TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tc_bookings TO authenticated;
GRANT ALL ON public.tc_bookings TO service_role;

GRANT SELECT ON public.fx_rates TO authenticated;
GRANT ALL ON public.fx_rates TO service_role;