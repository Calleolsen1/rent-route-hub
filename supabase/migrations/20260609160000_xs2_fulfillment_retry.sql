-- Auto-fulfillment retry support.
--
-- Two failure modes the Stripe → xs2 webhook can leave behind:
--   1. confirmBooking errored (notes stamped, no xs2_booking_id)
--   2. confirmBooking succeeded but getETicketZipUrl returned null
--      (xs2 supplier hasn't issued tickets yet — common when event is
--      weeks/months away)
--
-- A scheduled function (xs2-retry-pending) walks orders in either state
-- on a cadence. These columns let it: (a) avoid hammering xs2 on the
-- same order, (b) back off after repeated failures, (c) suppress
-- duplicate "tickets ready" emails.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fulfillment_last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS tickets_ready_email_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_pending
  ON public.orders (paid_at)
  WHERE status IN ('paid', 'fulfilled')
    AND tickets_ready_email_sent_at IS NULL;
