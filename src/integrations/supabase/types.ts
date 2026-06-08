export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      events: {
        Row: {
          away_team: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          external_event_id: string | null
          external_tournament_id: string | null
          home_team: string | null
          id: string
          last_synced_at: string | null
          race_name: string | null
          source: string
          sport: Database["public"]["Enums"]["event_sport"]
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          tournament_name: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          away_team?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          external_event_id?: string | null
          external_tournament_id?: string | null
          home_team?: string | null
          id?: string
          last_synced_at?: string | null
          race_name?: string | null
          source?: string
          sport: Database["public"]["Enums"]["event_sport"]
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          tournament_name: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          away_team?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          external_event_id?: string | null
          external_tournament_id?: string | null
          home_team?: string | null
          id?: string
          last_synced_at?: string | null
          race_name?: string | null
          source?: string
          sport?: Database["public"]["Enums"]["event_sport"]
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          tournament_name?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          created_by_admin_id: string | null
          id: string
          question: string
          status: string
          updated_at: string
          updated_by_admin_id: string | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          created_by_admin_id?: string | null
          id?: string
          question: string
          status?: string
          updated_at?: string
          updated_by_admin_id?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          created_by_admin_id?: string | null
          id?: string
          question?: string
          status?: string
          updated_at?: string
          updated_by_admin_id?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          admin_notes: string | null
          assigned_admin_id: string | null
          budget_sek: number | null
          company: string | null
          created_at: string
          destination: string | null
          email: string
          group_size: number | null
          id: string
          message: string
          name: string
          phone: string
          preferred_dates_end: string | null
          preferred_dates_start: string | null
          source_page: string | null
          sport_or_topic: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          type: Database["public"]["Enums"]["inquiry_type"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_admin_id?: string | null
          budget_sek?: number | null
          company?: string | null
          created_at?: string
          destination?: string | null
          email: string
          group_size?: number | null
          id?: string
          message: string
          name: string
          phone: string
          preferred_dates_end?: string | null
          preferred_dates_start?: string | null
          source_page?: string | null
          sport_or_topic?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          type: Database["public"]["Enums"]["inquiry_type"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_admin_id?: string | null
          budget_sek?: number | null
          company?: string | null
          created_at?: string
          destination?: string | null
          email?: string
          group_size?: number | null
          id?: string
          message?: string
          name?: string
          phone?: string
          preferred_dates_end?: string | null
          preferred_dates_start?: string | null
          source_page?: string | null
          sport_or_topic?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          type?: Database["public"]["Enums"]["inquiry_type"]
          updated_at?: string
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_locked: boolean
          last_message_at: string
          listing_id: string | null
          locked_at: string | null
          locked_reason: string | null
          participant_1_id: string
          participant_2_id: string
          thread_type: Database["public"]["Enums"]["thread_type"] | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_locked?: boolean
          last_message_at?: string
          listing_id?: string | null
          locked_at?: string | null
          locked_reason?: string | null
          participant_1_id: string
          participant_2_id: string
          thread_type?: Database["public"]["Enums"]["thread_type"] | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_locked?: boolean
          last_message_at?: string
          listing_id?: string | null
          locked_at?: string | null
          locked_reason?: string | null
          participant_1_id?: string
          participant_2_id?: string
          thread_type?: Database["public"]["Enums"]["thread_type"] | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          body: string
          booking_id: string | null
          created_at: string
          from_user_id: string
          id: string
          read: boolean | null
          thread_id: string | null
          to_user_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          body: string
          booking_id?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          read?: boolean | null
          thread_id?: string | null
          to_user_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string
          booking_id?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          read?: boolean | null
          thread_id?: string | null
          to_user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          category_id: string
          created_at: string
          event_id: string
          external_ticket_ids: Json | null
          id: string
          order_id: string
          qty: number
          sub_category: string | null
          unit_price_sek: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          event_id: string
          external_ticket_ids?: Json | null
          id?: string
          order_id: string
          qty: number
          sub_category?: string | null
          unit_price_sek: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          event_id?: string
          external_ticket_ids?: Json | null
          id?: string
          order_id?: string
          qty?: number
          sub_category?: string | null
          unit_price_sek?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          total_sek: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          total_sek?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          total_sek?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          effective_from: string
          id: string
          is_active: boolean
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_from?: string
          id?: string
          is_active?: boolean
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_from?: string
          id?: string
          is_active?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string | null
          id: string
          is_demo: boolean | null
          is_system: boolean | null
          last_name: string | null
          nationality: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          id: string
          is_demo?: boolean | null
          is_system?: boolean | null
          last_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_demo?: boolean | null
          is_system?: boolean | null
          last_name?: string | null
          nationality?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      ticket_categories: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          external_category_id: string | null
          external_sub_category: string | null
          id: string
          last_synced_at: string | null
          name: string
          party_size_together: number
          qty_available: number
          unit_price_sek: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          external_category_id?: string | null
          external_sub_category?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          party_size_together?: number
          qty_available?: number
          unit_price_sek: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          external_category_id?: string | null
          external_sub_category?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          party_size_together?: number
          qty_available?: number
          unit_price_sek?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_method: string
          file_url: string | null
          id: string
          notes: string | null
          order_item_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          order_item_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          order_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_deliveries_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user_soft: {
        Args: { p_admin_user_id: string; p_user_id: string }
        Returns: Json
      }
      admin_get_support_conversations: {
        Args: {
          p_admin_user_id: string
          p_search_query?: string
          p_sort_by?: string
        }
        Returns: {
          last_message: string
          last_message_time: string
          thread_id: string
          unread_count: number
          user_avatar: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      admin_search_faqs: {
        Args: {
          category_filter?: string
          search_query?: string
          sort_by?: string
          sort_order?: string
          status_filter?: string
        }
        Returns: {
          answer: string
          category: string
          created_at: string
          id: string
          question: string
          status: string
          updated_at: string
        }[]
      }
      admin_search_users: {
        Args: {
          role_filter?: Database["public"]["Enums"]["app_role"]
          search_query?: string
          sort_by?: string
          sort_order?: string
          status_filter?: Database["public"]["Enums"]["user_status"]
        }
        Returns: {
          avatar_url: string
          bookings_count: number
          created_at: string
          email: string
          first_name: string
          full_name: string
          id: string
          last_name: string
          listings_count: number
          primary_role: string
          status: Database["public"]["Enums"]["user_status"]
          user_display_id: string
        }[]
      }
      admin_suspend_user: {
        Args: { p_admin_user_id: string; p_user_id: string }
        Returns: Json
      }
      admin_unsuspend_user: {
        Args: { p_admin_user_id: string; p_user_id: string }
        Returns: Json
      }
      get_demo_credentials: {
        Args: never
        Returns: {
          email: string
          password: string
          role: string
        }[]
      }
      get_or_create_support_thread: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_or_create_thread: {
        Args: {
          p_booking_id?: string
          p_listing_id?: string
          p_participant_1_id: string
          p_participant_2_id: string
        }
        Returns: string
      }
      get_public_profiles: {
        Args: never
        Returns: {
          about: string
          avatar_url: string
          created_at: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_unread_inbox_conversations: {
        Args: { p_user_id: string }
        Returns: {
          booking_id: string
          is_locked: boolean
          last_message: string
          last_message_time: string
          listing_address: string
          listing_title: string
          locked_at: string
          locked_reason: string
          other_user_id: string
          other_user_name: string
          thread_id: string
          unread_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_user_admin: { Args: { target_user_id: string }; Returns: undefined }
      process_guest_debt_payment:
        | {
            Args: { p_approved_amount: number; p_dispute_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_guest_debt_id: string
              p_payment_amount: number
              p_payment_currency: string
              p_payment_provider: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_currency?: string
              p_guest_debt_id: string
              p_provider: string
            }
            Returns: Json
          }
      process_guest_refund:
        | {
            Args: { p_approved_refund_amount: number; p_dispute_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_approved_refund_amount: number
              p_dispute_id: string
              p_resolution_notes: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_approved_amount: number
              p_booking_id: string
              p_booking_status: string
              p_currency: string
              p_dispute_id: string
              p_host_user_id: string
              p_resolution_notes: string
            }
            Returns: undefined
          }
      process_host_claim:
        | {
            Args: {
              p_approved_claim_amount: number
              p_dispute_id: string
              p_resolution_notes: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_approved_amount: number
              p_booking_id: string
              p_currency: string
              p_dispute_id: string
              p_host_user_id: string
              p_resolution_notes: string
            }
            Returns: undefined
          }
      search_inbox_conversations: {
        Args: { p_search_query?: string; p_sort_by?: string; p_user_id: string }
        Returns: {
          booking_id: string
          last_message: string
          last_message_time: string
          listing_address: string
          listing_title: string
          other_user_id: string
          other_user_name: string
          thread_id: string
          unread_count: number
        }[]
      }
      send_dispute_resolution_message: {
        Args: {
          p_decision: string
          p_dispute_id: string
          p_is_guest_dispute?: boolean
          p_refund_amount?: number
          p_resolution_notes?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "host" | "guest"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "cancelled_guest"
        | "cancelled_host"
        | "completed"
        | "expired"
      cancellation_policy: "flexible" | "moderate" | "strict"
      dispute_category:
        | "refund_request"
        | "policy_violation"
        | "property_damage"
        | "cleanliness_issue"
        | "amenity_issue"
        | "safety_concern"
        | "billing_dispute"
        | "other"
      dispute_status:
        | "open"
        | "in_progress"
        | "resolved"
        | "closed"
        | "escalated"
        | "pending"
        | "on_hold"
        | "resolved_approved"
        | "resolved_declined"
      event_sport: "soccer" | "formula1"
      event_status: "upcoming" | "sold_out" | "completed" | "cancelled"
      inquiry_status: "new" | "in_progress" | "quoted" | "won" | "lost"
      inquiry_type: "group" | "conference" | "training_camp" | "vip" | "contact"
      listing_status: "draft" | "pending" | "approved" | "rejected" | "blocked"
      order_status:
        | "pending"
        | "paid"
        | "fulfilled"
        | "failed"
        | "refunded"
        | "cancelled"
      payout_status_enum: "pending" | "completed" | "failed" | "cancelled"
      property_type: "apartment" | "villa" | "room" | "house" | "condo"
      review_status: "pending" | "approved" | "rejected" | "blocked"
      thread_type: "user_to_user" | "user_to_support"
      user_status: "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "host", "guest"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "cancelled_guest",
        "cancelled_host",
        "completed",
        "expired",
      ],
      cancellation_policy: ["flexible", "moderate", "strict"],
      dispute_category: [
        "refund_request",
        "policy_violation",
        "property_damage",
        "cleanliness_issue",
        "amenity_issue",
        "safety_concern",
        "billing_dispute",
        "other",
      ],
      dispute_status: [
        "open",
        "in_progress",
        "resolved",
        "closed",
        "escalated",
        "pending",
        "on_hold",
        "resolved_approved",
        "resolved_declined",
      ],
      event_sport: ["soccer", "formula1"],
      event_status: ["upcoming", "sold_out", "completed", "cancelled"],
      inquiry_status: ["new", "in_progress", "quoted", "won", "lost"],
      inquiry_type: ["group", "conference", "training_camp", "vip", "contact"],
      listing_status: ["draft", "pending", "approved", "rejected", "blocked"],
      order_status: [
        "pending",
        "paid",
        "fulfilled",
        "failed",
        "refunded",
        "cancelled",
      ],
      payout_status_enum: ["pending", "completed", "failed", "cancelled"],
      property_type: ["apartment", "villa", "room", "house", "condo"],
      review_status: ["pending", "approved", "rejected", "blocked"],
      thread_type: ["user_to_user", "user_to_support"],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
