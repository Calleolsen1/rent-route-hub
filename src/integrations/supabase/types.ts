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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_documents: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string | null
          doc_type: string
          error_message: string | null
          id: string
          invoice_id: string | null
          recipient_email: string
          sent_at: string
          status: string
          subject: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          doc_type: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          recipient_email: string
          sent_at?: string
          status?: string
          subject?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          doc_type?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_margin_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "upcoming_departures_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          airline: string | null
          arrive_at: string | null
          booking_id: string
          booking_reference: string | null
          check_in: string | null
          check_out: string | null
          cost_sek: number
          created_at: string
          depart_at: string | null
          description: string
          event_name: string | null
          flight_number: string | null
          from_airport: string | null
          hotel_id: string | null
          id: string
          is_round_trip: boolean
          item_type: Database["public"]["Enums"]["booking_item_type"]
          notes: string | null
          qty: number
          return_depart_at: string | null
          return_flight_number: string | null
          room_type: string | null
          rooms: number | null
          sale_sek: number
          sort_order: number
          supplier: string | null
          ticket_category: string | null
          to_airport: string | null
          transfer_at: string | null
          transfer_from: string | null
          transfer_to: string | null
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          airline?: string | null
          arrive_at?: string | null
          booking_id: string
          booking_reference?: string | null
          check_in?: string | null
          check_out?: string | null
          cost_sek?: number
          created_at?: string
          depart_at?: string | null
          description: string
          event_name?: string | null
          flight_number?: string | null
          from_airport?: string | null
          hotel_id?: string | null
          id?: string
          is_round_trip?: boolean
          item_type: Database["public"]["Enums"]["booking_item_type"]
          notes?: string | null
          qty?: number
          return_depart_at?: string | null
          return_flight_number?: string | null
          room_type?: string | null
          rooms?: number | null
          sale_sek?: number
          sort_order?: number
          supplier?: string | null
          ticket_category?: string | null
          to_airport?: string | null
          transfer_at?: string | null
          transfer_from?: string | null
          transfer_to?: string | null
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          airline?: string | null
          arrive_at?: string | null
          booking_id?: string
          booking_reference?: string | null
          check_in?: string | null
          check_out?: string | null
          cost_sek?: number
          created_at?: string
          depart_at?: string | null
          description?: string
          event_name?: string | null
          flight_number?: string | null
          from_airport?: string | null
          hotel_id?: string | null
          id?: string
          is_round_trip?: boolean
          item_type?: Database["public"]["Enums"]["booking_item_type"]
          notes?: string | null
          qty?: number
          return_depart_at?: string | null
          return_flight_number?: string | null
          room_type?: string | null
          rooms?: number | null
          sale_sek?: number
          sort_order?: number
          supplier?: string | null
          ticket_category?: string | null
          to_airport?: string | null
          transfer_at?: string | null
          transfer_from?: string | null
          transfer_to?: string | null
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_margin_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "upcoming_departures_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_travellers: {
        Row: {
          booking_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          id: string
          nationality: string | null
          notes: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          notes?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          notes?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_travellers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_margin_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_travellers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_travellers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "upcoming_departures_view"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_number: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          depart_date: string | null
          destination: string | null
          id: string
          inquiry_id: string | null
          internal_notes: string | null
          notes: string | null
          return_date: string | null
          status: Database["public"]["Enums"]["booking_status"]
          title: string
          travellers_count: number
          updated_at: string
        }
        Insert: {
          booking_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id: string
          deleted_at?: string | null
          depart_date?: string | null
          destination?: string | null
          id?: string
          inquiry_id?: string | null
          internal_notes?: string | null
          notes?: string | null
          return_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          title: string
          travellers_count?: number
          updated_at?: string
        }
        Update: {
          booking_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          depart_date?: string | null
          destination?: string | null
          id?: string
          inquiry_id?: string | null
          internal_notes?: string | null
          notes?: string | null
          return_date?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          title?: string
          travellers_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          billing_address: string | null
          billing_email: string | null
          city: string | null
          company_name: string | null
          contact_name: string
          country: string | null
          created_at: string
          customer_number: string | null
          email: string
          id: string
          notes: string | null
          org_number: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          billing_address?: string | null
          billing_email?: string | null
          city?: string | null
          company_name?: string | null
          contact_name: string
          country?: string | null
          created_at?: string
          customer_number?: string | null
          email: string
          id?: string
          notes?: string | null
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          billing_address?: string | null
          billing_email?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string
          country?: string | null
          created_at?: string
          customer_number?: string | null
          email?: string
          id?: string
          notes?: string | null
          org_number?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          away_team: string | null
          city: string | null
          compare_at_pct: number | null
          compare_at_price_sek: number | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          external_event_id: string | null
          external_tournament_id: string | null
          home_team: string | null
          id: string
          is_featured: boolean
          last_synced_at: string | null
          max_price_sek: number | null
          min_price_sek: number | null
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
          compare_at_pct?: number | null
          compare_at_price_sek?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          external_event_id?: string | null
          external_tournament_id?: string | null
          home_team?: string | null
          id?: string
          is_featured?: boolean
          last_synced_at?: string | null
          max_price_sek?: number | null
          min_price_sek?: number | null
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
          compare_at_pct?: number | null
          compare_at_price_sek?: number | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          external_event_id?: string | null
          external_tournament_id?: string | null
          home_team?: string | null
          id?: string
          is_featured?: boolean
          last_synced_at?: string | null
          max_price_sek?: number | null
          min_price_sek?: number | null
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
      home_slides: {
        Row: {
          created_at: string
          cta_label: string | null
          cta_to: string | null
          description: string | null
          draft_data: Json | null
          eyebrow: string | null
          id: string
          image_url: string
          is_active: boolean
          italic: string | null
          published_at: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          cta_to?: string | null
          description?: string | null
          draft_data?: Json | null
          eyebrow?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          italic?: string | null
          published_at?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          cta_to?: string | null
          description?: string | null
          draft_data?: Json | null
          eyebrow?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          italic?: string | null
          published_at?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotels: {
        Row: {
          address_line1: string | null
          city: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          website?: string | null
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
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          qty: number
          sort_order: number
          unit_price_sek: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          qty?: number
          sort_order?: number
          unit_price_sek?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          qty?: number
          sort_order?: number
          unit_price_sek?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount_sek: number
          created_at: string
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
          paid_on: string
          reference: string | null
        }
        Insert: {
          amount_sek: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
          paid_on?: string
          reference?: string | null
        }
        Update: {
          amount_sek?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
          paid_on?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          accounting_account: string | null
          booking_id: string | null
          created_at: string
          currency: string
          customer_id: string
          due_date: string
          exported_at: string | null
          id: string
          invoice_number: string | null
          issue_date: string
          notes: string | null
          paid_at: string | null
          paid_sek: number
          reference: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["bo_invoice_status"]
          subtotal_sek: number
          total_sek: number
          updated_at: string
          vat_rate: number
          vat_sek: number
        }
        Insert: {
          accounting_account?: string | null
          booking_id?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          due_date?: string
          exported_at?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          paid_sek?: number
          reference?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["bo_invoice_status"]
          subtotal_sek?: number
          total_sek?: number
          updated_at?: string
          vat_rate?: number
          vat_sek?: number
        }
        Update: {
          accounting_account?: string | null
          booking_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          due_date?: string
          exported_at?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          notes?: string | null
          paid_at?: string | null
          paid_sek?: number
          reference?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["bo_invoice_status"]
          subtotal_sek?: number
          total_sek?: number
          updated_at?: string
          vat_rate?: number
          vat_sek?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_margin_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "upcoming_departures_view"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      nav_menu_entries: {
        Row: {
          city: string | null
          created_at: string
          date_text: string | null
          description: string | null
          features_json: Json
          group_label: string | null
          hero_image_url: string | null
          id: string
          is_active: boolean
          name: string
          short_date: string | null
          show_in_menu: boolean
          slug: string
          sort_order: number
          sport_id: string
          tagline: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          date_text?: string | null
          description?: string | null
          features_json?: Json
          group_label?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          short_date?: string | null
          show_in_menu?: boolean
          slug: string
          sort_order?: number
          sport_id: string
          tagline?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          date_text?: string | null
          description?: string | null
          features_json?: Json
          group_label?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          short_date?: string | null
          show_in_menu?: boolean
          slug?: string
          sort_order?: number
          sport_id?: string
          tagline?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nav_menu_entries_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "nav_sports"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_sports: {
        Row: {
          created_at: string
          entry_kind: string
          id: string
          is_active: boolean
          label: string
          menu_style: string
          slug: string
          sort_order: number
          sport_filter: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entry_kind?: string
          id?: string
          is_active?: boolean
          label: string
          menu_style?: string
          slug: string
          sort_order?: number
          sport_filter?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entry_kind?: string
          id?: string
          is_active?: boolean
          label?: string
          menu_style?: string
          slug?: string
          sort_order?: number
          sport_filter?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nav_top_menu_items: {
        Row: {
          created_at: string
          href: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          user_agent?: string | null
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
          fulfillment_attempt_count: number
          fulfillment_last_attempt_at: string | null
          id: string
          invoice_number: string | null
          last_refund_reason: string | null
          notes: string | null
          paid_at: string | null
          quote_id: string | null
          refunded_sek: number
          reservation_expires_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          tickets_ready_email_sent_at: string | null
          total_paid_sek: number | null
          total_sek: number
          updated_at: string
          user_id: string | null
          xs2_booking_id: string | null
          xs2_reservation_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          fulfillment_attempt_count?: number
          fulfillment_last_attempt_at?: string | null
          id?: string
          invoice_number?: string | null
          last_refund_reason?: string | null
          notes?: string | null
          paid_at?: string | null
          quote_id?: string | null
          refunded_sek?: number
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tickets_ready_email_sent_at?: string | null
          total_paid_sek?: number | null
          total_sek?: number
          updated_at?: string
          user_id?: string | null
          xs2_booking_id?: string | null
          xs2_reservation_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          fulfillment_attempt_count?: number
          fulfillment_last_attempt_at?: string | null
          id?: string
          invoice_number?: string | null
          last_refund_reason?: string | null
          notes?: string | null
          paid_at?: string | null
          quote_id?: string | null
          refunded_sek?: number
          reservation_expires_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tickets_ready_email_sent_at?: string | null
          total_paid_sek?: number | null
          total_sek?: number
          updated_at?: string
          user_id?: string | null
          xs2_booking_id?: string | null
          xs2_reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
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
      quote_items: {
        Row: {
          created_at: string
          description: string
          id: string
          qty: number
          quote_id: string
          sort_order: number
          unit_price_sek: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          qty?: number
          quote_id: string
          sort_order?: number
          unit_price_sek: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          qty?: number
          quote_id?: string
          sort_order?: number
          unit_price_sek?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_email: string
          customer_name: string | null
          expires_at: string
          id: string
          inquiry_id: string | null
          intro_message: string | null
          order_id: string | null
          public_token: string
          sent_at: string | null
          status: string
          stripe_checkout_session_id: string | null
          title: string
          total_sek: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email: string
          customer_name?: string | null
          expires_at: string
          id?: string
          inquiry_id?: string | null
          intro_message?: string | null
          order_id?: string | null
          public_token?: string
          sent_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          title: string
          total_sek: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string
          customer_name?: string | null
          expires_at?: string
          id?: string
          inquiry_id?: string | null
          intro_message?: string | null
          order_id?: string | null
          public_token?: string
          sent_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          title?: string
          total_sek?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_sek: number
          created_at: string
          id: string
          order_id: string
          processed_by: string | null
          reason: string | null
          stripe_refund_id: string | null
        }
        Insert: {
          amount_sek: number
          created_at?: string
          id?: string
          order_id: string
          processed_by?: string | null
          reason?: string | null
          stripe_refund_id?: string | null
        }
        Update: {
          amount_sek?: number
          created_at?: string
          id?: string
          order_id?: string
          processed_by?: string | null
          reason?: string | null
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          description: string | null
          draft_value: string | null
          key: string
          published_at: string | null
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          draft_value?: string | null
          key: string
          published_at?: string | null
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          draft_value?: string | null
          key?: string
          published_at?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_errors: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          kind: string
          message: string
          order_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_note: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          kind: string
          message: string
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_note?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          kind?: string
          message?: string
          order_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_errors_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_published: boolean
          name: string
          phone: string | null
          photo_url: string | null
          role_title: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_published?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          role_title?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_published?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          role_title?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author: string
          created_at: string
          id: string
          is_active: boolean
          quote: string
          rating: number
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          author: string
          created_at?: string
          id?: string
          is_active?: boolean
          quote: string
          rating?: number
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author?: string
          created_at?: string
          id?: string
          is_active?: boolean
          quote?: string
          rating?: number
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_categories: {
        Row: {
          compare_at_pct: number | null
          compare_at_price_sek: number | null
          created_at: string
          currency: string
          description: string | null
          event_id: string
          external_category_id: string | null
          external_sub_category: string | null
          id: string
          last_synced_at: string | null
          markup_fixed_sek: number
          markup_pct: number
          name: string
          party_size_together: number
          qty_available: number
          stripe_price_id: string | null
          unit_price_sek: number
          updated_at: string
        }
        Insert: {
          compare_at_pct?: number | null
          compare_at_price_sek?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          external_category_id?: string | null
          external_sub_category?: string | null
          id?: string
          last_synced_at?: string | null
          markup_fixed_sek?: number
          markup_pct?: number
          name: string
          party_size_together?: number
          qty_available?: number
          stripe_price_id?: string | null
          unit_price_sek: number
          updated_at?: string
        }
        Update: {
          compare_at_pct?: number | null
          compare_at_price_sek?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          external_category_id?: string | null
          external_sub_category?: string | null
          id?: string
          last_synced_at?: string | null
          markup_fixed_sek?: number
          markup_pct?: number
          name?: string
          party_size_together?: number
          qty_available?: number
          stripe_price_id?: string | null
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
      why_us_cards: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      xs2_sync_log: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          records_fetched: number
          records_upserted: number
          resource_type: string
          started_at: string
          status: string
          trigger: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          records_fetched?: number
          records_upserted?: number
          resource_type: string
          started_at?: string
          status?: string
          trigger?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          records_fetched?: number
          records_upserted?: number
          resource_type?: string
          started_at?: string
          status?: string
          trigger?: string
        }
        Relationships: []
      }
    }
    Views: {
      booking_margin_view: {
        Row: {
          booking_id: string | null
          booking_number: string | null
          company_name: string | null
          contact_name: string | null
          cost_total_sek: number | null
          customer_id: string | null
          depart_date: string | null
          destination: string | null
          margin_sek: number | null
          return_date: string | null
          sale_total_sek: number | null
          status: Database["public"]["Enums"]["booking_status"] | null
          title: string | null
          travellers_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      sales_forecast_view: {
        Row: {
          bookings_count: number | null
          cost_total_sek: number | null
          destination: string | null
          margin_sek: number | null
          month: string | null
          sale_total_sek: number | null
        }
        Relationships: []
      }
      upcoming_departures_view: {
        Row: {
          booking_id: string | null
          booking_number: string | null
          company_name: string | null
          contact_name: string | null
          depart_date: string | null
          destination: string | null
          email: string | null
          phone: string | null
          return_date: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          title: string | null
          travellers_count: number | null
        }
        Relationships: []
      }
      user_admin_view: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          last_name: string | null
          orders_count: number | null
          primary_role: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["user_status"] | null
          user_display_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          last_name?: string | null
          orders_count?: never
          primary_role?: never
          status?: Database["public"]["Enums"]["user_status"] | null
          user_display_id?: never
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          last_name?: string | null
          orders_count?: never
          primary_role?: never
          status?: Database["public"]["Enums"]["user_status"] | null
          user_display_id?: never
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
          created_at: string
          email: string
          first_name: string
          full_name: string
          id: string
          last_name: string
          orders_count: number
          primary_role: string
          status: Database["public"]["Enums"]["user_status"]
          user_display_id: string
        }[]
      }
      admin_set_ticket_stripe_price: {
        Args: { p_category_id: string; p_lookup_key: string }
        Returns: undefined
      }
      admin_suspend_user: {
        Args: { p_admin_user_id: string; p_user_id: string }
        Returns: Json
      }
      admin_unsuspend_user: {
        Args: { p_admin_user_id: string; p_user_id: string }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: number }
      complete_past_bookings: { Args: never; Returns: number }
      consume_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_sec: number }
        Returns: boolean
      }
      create_order_with_items: {
        Args: {
          p_category_id: string
          p_customer_email?: string
          p_customer_name?: string
          p_customer_phone?: string
          p_event_id: string
          p_qty: number
          p_unit_price_sek: number
        }
        Returns: string
      }
      decrement_ticket_qty: {
        Args: { p_category_id: string; p_qty: number }
        Returns: undefined
      }
      expire_old_quotes: { Args: never; Returns: number }
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
      get_order_by_session: {
        Args: { p_order_id: string; p_session_id: string }
        Returns: Json
      }
      get_platform_decimal: {
        Args: { p_default: number; p_key: string }
        Returns: number
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
      get_quote_by_token: { Args: { p_token: string }; Returns: Json }
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
      set_group_compare_at_pct: {
        Args: { p_pct: number; p_sport?: string; p_tournament_name?: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "host" | "guest"
      bo_invoice_status:
        | "draft"
        | "sent"
        | "partly_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      booking_item_type: "hotel" | "flight" | "ticket" | "transfer" | "other"
      booking_status: "draft" | "confirmed" | "paid" | "completed" | "cancelled"
      event_sport: "soccer" | "formula1"
      event_status: "upcoming" | "sold_out" | "completed" | "cancelled"
      inquiry_status: "new" | "in_progress" | "quoted" | "won" | "lost"
      inquiry_type: "group" | "conference" | "training_camp" | "vip" | "contact"
      order_status:
        | "pending"
        | "paid"
        | "fulfilled"
        | "failed"
        | "refunded"
        | "cancelled"
        | "awaiting_payment"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      bo_invoice_status: [
        "draft",
        "sent",
        "partly_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      booking_item_type: ["hotel", "flight", "ticket", "transfer", "other"],
      booking_status: ["draft", "confirmed", "paid", "completed", "cancelled"],
      event_sport: ["soccer", "formula1"],
      event_status: ["upcoming", "sold_out", "completed", "cancelled"],
      inquiry_status: ["new", "in_progress", "quoted", "won", "lost"],
      inquiry_type: ["group", "conference", "training_camp", "vip", "contact"],
      order_status: [
        "pending",
        "paid",
        "fulfilled",
        "failed",
        "refunded",
        "cancelled",
        "awaiting_payment",
      ],
      thread_type: ["user_to_user", "user_to_support"],
      user_status: ["active", "inactive", "suspended"],
    },
  },
} as const
