
CREATE POLICY "Admins manage ticket files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'ticket-files' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'ticket-files' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers read own ticket files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-files'
  AND EXISTS (
    SELECT 1
    FROM public.ticket_deliveries d
    JOIN public.order_items oi ON oi.id = d.order_item_id
    JOIN public.orders o ON o.id = oi.order_id
    WHERE d.file_url LIKE '%' || storage.objects.name
      AND o.user_id = auth.uid()
  )
);
