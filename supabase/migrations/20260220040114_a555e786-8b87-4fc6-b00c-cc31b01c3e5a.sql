
-- Allow admins to delete messages in support threads
CREATE POLICY "Admins can delete support messages"
  ON public.messages FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND EXISTS (
      SELECT 1 FROM message_threads
      WHERE message_threads.id = messages.thread_id
      AND message_threads.thread_type = 'user_to_support'::thread_type
    )
  );

-- Allow admins to delete message threads
CREATE POLICY "Admins can delete support threads"
  ON public.message_threads FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND thread_type = 'user_to_support'::thread_type
  );
