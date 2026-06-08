-- Strip rental schema (deferred Task #7).
--
-- The repo originated as a short-term rental marketplace; it was pivoted to
-- Kaisen sports-ticket travel but the rental schema was never removed.
-- This drops all rental-only tables, functions, views, and enums.
--
-- KEEPS untouched:
--   * messaging primitives (message_threads, messages) — general-purpose
--   * profiles, user_roles, user_status, app_role enum
--   * ticket flow (events, ticket_categories, orders, order_items, ticket_deliveries)
--   * inquiry + quote flow
--   * xs2event additions
--
-- LEAVES the `app_role` enum value 'host' in place. Postgres can't drop enum
-- values cleanly; nothing in the new code paths sets role='host', so it's
-- dead-but-harmless. If you want a true rename to 'admin/staff/customer',
-- do it in a focused future migration after auditing every RLS policy.

-- ============================================================================
-- 1. Drop the admin view + function that join to rental tables
-- ============================================================================
DROP FUNCTION IF EXISTS public.admin_search_users(text, user_status, app_role, text, text);
DROP VIEW IF EXISTS public.user_admin_view;

-- ============================================================================
-- 2. Drop rental-only Postgres functions
-- ============================================================================
DROP FUNCTION IF EXISTS public.host_search_listings(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.host_search_listings(uuid, text, listing_status, text, text);
DROP FUNCTION IF EXISTS public.host_search_bookings(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.host_search_bookings(uuid, text, booking_status, text, text);
DROP FUNCTION IF EXISTS public.host_search_payouts(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.host_cancel_booking_full_refund(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_with_refund(uuid);
DROP FUNCTION IF EXISTS public.cancel_booking_with_refund(uuid, text);
DROP FUNCTION IF EXISTS public.cancel_expired_bookings();
DROP FUNCTION IF EXISTS public.mark_past_bookings_completed();
DROP FUNCTION IF EXISTS public.create_booking_with_financial_snapshot CASCADE;
DROP FUNCTION IF EXISTS public.confirm_booking_payment CASCADE;
DROP FUNCTION IF EXISTS public.process_guest_refund(uuid);
DROP FUNCTION IF EXISTS public.process_guest_refund(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.process_host_claim CASCADE;
DROP FUNCTION IF EXISTS public.create_payout_on_booking_completion() CASCADE;
DROP FUNCTION IF EXISTS public.get_host_earnings_report CASCADE;
DROP FUNCTION IF EXISTS public.get_host_dashboard_kpis CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_disputes(text, text, text, numeric, numeric, date, date, text, text);
DROP FUNCTION IF EXISTS public.admin_search_payouts CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_bookings CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_listings CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_guest_debts CASCADE;
DROP FUNCTION IF EXISTS public.admin_search_reviews CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_listings_reviews_report CASCADE;
DROP FUNCTION IF EXISTS public.admin_get_listing_reviews_detail CASCADE;
DROP FUNCTION IF EXISTS public.admin_export_reviews_custom_report CASCADE;
DROP FUNCTION IF EXISTS public.admin_resolve_dispute(uuid, text, numeric, text);
DROP FUNCTION IF EXISTS public.admin_resolve_dispute(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.admin_get_dispute_details(uuid);
DROP FUNCTION IF EXISTS public.admin_get_weekly_bookings(integer);
DROP FUNCTION IF EXISTS public.admin_get_weekly_revenue(integer);
DROP FUNCTION IF EXISTS public.admin_get_weekly_revenue_report(date, date);
DROP FUNCTION IF EXISTS public.admin_get_detailed_revenue_report(date, date);
DROP FUNCTION IF EXISTS public.admin_mark_payout_completed(uuid);
DROP FUNCTION IF EXISTS public.calculate_listing_rating(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_rating_on_review_insert() CASCADE;
DROP FUNCTION IF EXISTS public.update_rating_on_review_update() CASCADE;
DROP FUNCTION IF EXISTS public.update_rating_on_review_delete() CASCADE;
DROP FUNCTION IF EXISTS public.set_review_listing_id() CASCADE;
DROP FUNCTION IF EXISTS public.check_guest_outstanding_debts(uuid);
DROP FUNCTION IF EXISTS public.expire_old_guest_debts();
DROP FUNCTION IF EXISTS public.apply_outstanding_debts_to_payout();
DROP FUNCTION IF EXISTS public.apply_outstanding_debts_to_payout(uuid);
DROP FUNCTION IF EXISTS public.get_eligible_refund_amount(uuid);
DROP FUNCTION IF EXISTS public.create_dispute_with_support_thread CASCADE;
DROP FUNCTION IF EXISTS public.send_dispute_resolution_message CASCADE;
DROP FUNCTION IF EXISTS public.process_guest_debt_payment CASCADE;

-- ============================================================================
-- 3. Drop rental tables (CASCADE removes dependent FKs, triggers, RLS, etc.)
-- ============================================================================
-- Order matters less with CASCADE but list child → parent for clarity.
DROP TABLE IF EXISTS public.listing_moderation_feedback CASCADE;
DROP TABLE IF EXISTS public.listing_availability CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.guest_debts CASCADE;
DROP TABLE IF EXISTS public.payouts CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.cancellation_policies CASCADE;

-- ============================================================================
-- 4. Drop rental enums (now that no column references them)
-- ============================================================================
DROP TYPE IF EXISTS public.booking_status;
DROP TYPE IF EXISTS public.cancellation_policy;
DROP TYPE IF EXISTS public.listing_status;
DROP TYPE IF EXISTS public.property_type;
DROP TYPE IF EXISTS public.review_status;
DROP TYPE IF EXISTS public.dispute_category;
DROP TYPE IF EXISTS public.dispute_status;
DROP TYPE IF EXISTS public.payout_status_enum;

-- ============================================================================
-- 5. Recreate user_admin_view + admin_search_users without rental joins
-- ============================================================================
-- listings_count is gone entirely; bookings_count is replaced with orders_count
-- (counts the user's ticket/quote orders, the Kaisen equivalent of bookings).

CREATE OR REPLACE VIEW public.user_admin_view
  WITH (security_invoker = on)
AS
SELECT
  p.id,
  CONCAT('#', SUBSTRING(p.id::text, 1, 4), '-', SUBSTRING(p.id::text, 5, 2)) AS user_display_id,
  p.first_name,
  p.last_name,
  CONCAT(p.first_name, ' ', p.last_name) AS full_name,
  p.email,
  p.avatar_url,
  p.status,
  p.created_at,
  COALESCE(
    (SELECT role FROM public.user_roles
       WHERE user_id = p.id
       ORDER BY CASE
         WHEN role = 'admin' THEN 1
         WHEN role = 'guest' THEN 2
         ELSE 3
       END
       LIMIT 1),
    'guest'
  ) AS primary_role,
  (SELECT COUNT(*) FROM public.orders WHERE user_id = p.id)::int AS orders_count
FROM public.profiles p
ORDER BY p.created_at DESC;

GRANT SELECT ON public.user_admin_view TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_search_users(
  search_query text DEFAULT NULL,
  status_filter user_status DEFAULT NULL,
  role_filter app_role DEFAULT NULL,
  sort_by text DEFAULT 'created_at',
  sort_order text DEFAULT 'desc'
)
RETURNS TABLE (
  id uuid,
  user_display_id text,
  first_name text,
  last_name text,
  full_name text,
  email text,
  avatar_url text,
  status user_status,
  created_at timestamptz,
  primary_role text,
  orders_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can search users';
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.user_display_id,
    v.first_name,
    v.last_name,
    v.full_name,
    v.email,
    v.avatar_url,
    v.status,
    v.created_at,
    v.primary_role::text,
    v.orders_count
  FROM public.user_admin_view v
  WHERE
    (search_query IS NULL OR
     v.full_name ILIKE '%' || search_query || '%' OR
     v.email ILIKE '%' || search_query || '%')
    AND (status_filter IS NULL OR v.status = status_filter)
    AND (role_filter IS NULL OR v.primary_role::app_role = role_filter)
  ORDER BY
    CASE WHEN sort_by = 'created_at' AND sort_order = 'desc' THEN v.created_at END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_order = 'asc'  THEN v.created_at END ASC,
    CASE WHEN sort_by = 'full_name'  AND sort_order = 'asc'  THEN v.full_name  END ASC,
    CASE WHEN sort_by = 'full_name'  AND sort_order = 'desc' THEN v.full_name  END DESC,
    v.created_at DESC;
END;
$$;
