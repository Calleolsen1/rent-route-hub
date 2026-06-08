
-- Drop marketplace tables (CASCADE removes dependent triggers, policies, FKs, views)
DROP TABLE IF EXISTS public.listing_moderation_feedback CASCADE;
DROP TABLE IF EXISTS public.listing_availability    CASCADE;
DROP TABLE IF EXISTS public.reviews                 CASCADE;
DROP TABLE IF EXISTS public.disputes                CASCADE;
DROP TABLE IF EXISTS public.payouts                 CASCADE;
DROP TABLE IF EXISTS public.transactions            CASCADE;
DROP TABLE IF EXISTS public.guest_debts             CASCADE;
DROP TABLE IF EXISTS public.trip_members            CASCADE;
DROP TABLE IF EXISTS public.trip_groups             CASCADE;
DROP TABLE IF EXISTS public.trips                   CASCADE;
DROP TABLE IF EXISTS public.bookings                CASCADE;
DROP TABLE IF EXISTS public.cancellation_policies   CASCADE;
DROP TABLE IF EXISTS public.listings                CASCADE;
DROP TABLE IF EXISTS public.cities                  CASCADE;
DROP TABLE IF EXISTS public.states_regions          CASCADE;
DROP TABLE IF EXISTS public.countries               CASCADE;

-- Drop marketplace-only DB functions across all overloads by iterating pg_proc.
-- Kept: admin_search_users, admin_search_faqs, admin_delete_user_soft,
-- admin_suspend_user, admin_unsuspend_user, admin_get_support_conversations,
-- has_role, handle_new_user, make_user_admin, get_demo_credentials,
-- get_public_profiles, get_or_create_thread, get_or_create_support_thread,
-- get_unread_inbox_conversations, update_updated_at_column.
DO $$
DECLARE
  fn_names text[] := ARRAY[
    'admin_search_listings','admin_search_bookings','admin_search_payouts',
    'admin_search_transactions','admin_search_reviews','admin_search_disputes',
    'admin_search_guest_debts','admin_get_listing_reviews_detail',
    'admin_get_listings_reviews_report','admin_export_reviews_custom_report',
    'admin_get_detailed_revenue_report','admin_get_weekly_revenue',
    'admin_get_weekly_revenue_report','admin_get_weekly_bookings',
    'admin_get_dispute_details','admin_resolve_dispute','admin_mark_payout_completed',
    'apply_outstanding_debts_to_payout','calculate_listing_rating',
    'cancel_booking_with_refund','cancel_expired_bookings',
    'check_guest_outstanding_debts','confirm_booking_payment',
    'create_booking_with_financial_snapshot','create_dispute_with_support_thread',
    'create_payout_on_booking_completion','expire_old_guest_debts',
    'get_admin_dashboard_kpis','get_eligible_refund_amount',
    'get_host_dashboard_kpis','get_host_earnings_report',
    'host_cancel_booking_full_refund','host_search_bookings',
    'host_search_listings','host_search_payouts','mark_past_bookings_completed'
  ];
  fn_name text;
  proc_record record;
BEGIN
  FOREACH fn_name IN ARRAY fn_names LOOP
    FOR proc_record IN
      SELECT oid::regprocedure AS sig
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
        AND proname = fn_name
    LOOP
      EXECUTE 'DROP FUNCTION IF EXISTS ' || proc_record.sig::text || ' CASCADE';
    END LOOP;
  END LOOP;
END $$;
