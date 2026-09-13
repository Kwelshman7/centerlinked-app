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
      access_request_rate_limits: {
        Row: {
          attempts: number
          fingerprint: string
          updated_at: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          fingerprint: string
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          fingerprint?: string
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      accreditation_bodies: {
        Row: {
          active: boolean
          aliases: string[]
          canonical_name: string
          created_at: string
          id: string
          kind: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          aliases?: string[]
          canonical_name: string
          created_at?: string
          id?: string
          kind?: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          aliases?: string[]
          canonical_name?: string
          created_at?: string
          id?: string
          kind?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      bd_representatives: {
        Row: {
          active: boolean
          availability_status: string
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          internal_notes: string | null
          last_verified_at: string | null
          organization_id: string | null
          organization_name: string | null
          payer_expertise: string[]
          phone: string | null
          preferred_contact_method: string | null
          states_covered: string[]
          territory: string | null
          title: string | null
          updated_at: string
          verification_method: string | null
          verified_by: string | null
        }
        Insert: {
          active?: boolean
          availability_status?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          internal_notes?: string | null
          last_verified_at?: string | null
          organization_id?: string | null
          organization_name?: string | null
          payer_expertise?: string[]
          phone?: string | null
          preferred_contact_method?: string | null
          states_covered?: string[]
          territory?: string | null
          title?: string | null
          updated_at?: string
          verification_method?: string | null
          verified_by?: string | null
        }
        Update: {
          active?: boolean
          availability_status?: string
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          last_verified_at?: string | null
          organization_id?: string | null
          organization_name?: string | null
          payer_expertise?: string[]
          phone?: string | null
          preferred_contact_method?: string | null
          states_covered?: string[]
          territory?: string | null
          title?: string | null
          updated_at?: string
          verification_method?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      facility_bd_assignments: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          is_primary: boolean
          representative_id: string
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          is_primary?: boolean
          representative_id: string
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          is_primary?: boolean
          representative_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_bd_assignments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bd_assignments_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "bd_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_personal_emails: {
        Row: {
          approved_by: string | null
          created_at: string
          email: string
          notes: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          email: string
          notes?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          email?: string
          notes?: string | null
        }
        Relationships: []
      }
      bootstrap_admin_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      contract_verifications: {
        Row: {
          action: string
          created_at: string
          facility_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          facility_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          facility_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_message_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
        }
        Relationships: []
      }
      early_access_leads: {
        Row: {
          created_at: string
          email: string
          facilities: string
          full_name: string
          id: string
          notes: string | null
          organization: string
          reviewed_at: string | null
          role: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          facilities: string
          full_name: string
          id?: string
          notes?: string | null
          organization: string
          reviewed_at?: string | null
          role?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          facilities?: string
          full_name?: string
          id?: string
          notes?: string | null
          organization?: string
          reviewed_at?: string | null
          role?: string | null
          status?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          accreditations: string[]
          address_line1: string | null
          address_line2: string | null
          bd_contact_email: string | null
          bd_contact_name: string | null
          bd_contact_phone: string | null
          bd_contact_title: string | null
          bd_contact_verified_at: string | null
          bd_contact_verified_by: string | null
          capacity: number | null
          city: string | null
          contracts_verified_at: string | null
          contracts_verified_by: string | null
          created_at: string
          description: string | null
          featured_payer: string | null
          hidden_from_org_page: boolean
          highlights: string[]
          id: string
          image_urls: string[]
          insurance_status: string | null
          levels_of_care: string[]
          name: string
          organization_id: string
          phone: string | null
          population_served: string[]
          preferred_provider: boolean
          preferred_until: string | null
          quick_highlights: string[]
          rejection_reason: string | null
          self_pay_only: boolean
          short_description: string | null
          slug: string | null
          specializations: string[]
          state: string | null
          submitted_by: string | null
          tagline: string | null
          treatment_focus: string | null
          updated_at: string
          verification_frozen: boolean
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          accreditations?: string[]
          address_line1?: string | null
          address_line2?: string | null
          bd_contact_email?: string | null
          bd_contact_name?: string | null
          bd_contact_phone?: string | null
          bd_contact_title?: string | null
          bd_contact_verified_at?: string | null
          bd_contact_verified_by?: string | null
          capacity?: number | null
          city?: string | null
          contracts_verified_at?: string | null
          contracts_verified_by?: string | null
          created_at?: string
          description?: string | null
          featured_payer?: string | null
          hidden_from_org_page?: boolean
          highlights?: string[]
          id?: string
          image_urls?: string[]
          insurance_status?: string | null
          levels_of_care?: string[]
          name: string
          organization_id: string
          phone?: string | null
          population_served?: string[]
          preferred_provider?: boolean
          preferred_until?: string | null
          quick_highlights?: string[]
          rejection_reason?: string | null
          self_pay_only?: boolean
          short_description?: string | null
          slug?: string | null
          specializations?: string[]
          state?: string | null
          submitted_by?: string | null
          tagline?: string | null
          treatment_focus?: string | null
          updated_at?: string
          verification_frozen?: boolean
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          accreditations?: string[]
          address_line1?: string | null
          address_line2?: string | null
          bd_contact_email?: string | null
          bd_contact_name?: string | null
          bd_contact_phone?: string | null
          bd_contact_title?: string | null
          bd_contact_verified_at?: string | null
          bd_contact_verified_by?: string | null
          capacity?: number | null
          city?: string | null
          contracts_verified_at?: string | null
          contracts_verified_by?: string | null
          created_at?: string
          description?: string | null
          featured_payer?: string | null
          hidden_from_org_page?: boolean
          highlights?: string[]
          id?: string
          image_urls?: string[]
          insurance_status?: string | null
          levels_of_care?: string[]
          name?: string
          organization_id?: string
          phone?: string | null
          population_served?: string[]
          preferred_provider?: boolean
          preferred_until?: string | null
          quick_highlights?: string[]
          rejection_reason?: string | null
          self_pay_only?: boolean
          short_description?: string | null
          slug?: string | null
          specializations?: string[]
          state?: string | null
          submitted_by?: string | null
          tagline?: string | null
          treatment_focus?: string | null
          updated_at?: string
          verification_frozen?: boolean
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_pdf_uploads: {
        Row: {
          created_at: string
          facilities_created: number | null
          filename: string
          id: string
          organization_id: string
          parsed_payload: Json | null
          size_bytes: number | null
          status: string
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          facilities_created?: number | null
          filename: string
          id?: string
          organization_id: string
          parsed_payload?: Json | null
          size_bytes?: number | null
          status?: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          facilities_created?: number | null
          filename?: string
          id?: string
          organization_id?: string
          parsed_payload?: Json | null
          size_bytes?: number | null
          status?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_pdf_uploads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_contracts: {
        Row: {
          contract_status: string
          covered_states: string[]
          created_at: string
          effective_date: string | null
          facility_id: string
          id: string
          in_network: boolean
          internal_notes: string | null
          levels_of_care_covered: string[]
          network_name: string | null
          notes: string | null
          original_imported_value: string | null
          payer_id: string | null
          payer_name: string
          plan_types: string[]
          termination_date: string | null
          updated_at: string
          verification_method: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          contract_status?: string
          covered_states?: string[]
          created_at?: string
          effective_date?: string | null
          facility_id: string
          id?: string
          in_network?: boolean
          internal_notes?: string | null
          levels_of_care_covered?: string[]
          network_name?: string | null
          notes?: string | null
          original_imported_value?: string | null
          payer_id?: string | null
          payer_name: string
          plan_types?: string[]
          termination_date?: string | null
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          contract_status?: string
          covered_states?: string[]
          created_at?: string
          effective_date?: string | null
          facility_id?: string
          id?: string
          in_network?: boolean
          internal_notes?: string | null
          levels_of_care_covered?: string[]
          network_name?: string | null
          notes?: string | null
          original_imported_value?: string | null
          payer_id?: string | null
          payer_name?: string
          plan_types?: string[]
          termination_date?: string | null
          updated_at?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_contracts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_contracts_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      normalization_change_log: {
        Row: {
          action: string
          created_at: string
          domain: string
          facility_id: string | null
          id: string
          notes: string | null
          record_id: string | null
          source_label: string
          target_name: string | null
          target_slug: string | null
        }
        Insert: {
          action: string
          created_at?: string
          domain: string
          facility_id?: string | null
          id?: string
          notes?: string | null
          record_id?: string | null
          source_label: string
          target_name?: string | null
          target_slug?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          domain?: string
          facility_id?: string | null
          id?: string
          notes?: string | null
          record_id?: string | null
          source_label?: string
          target_name?: string | null
          target_slug?: string | null
        }
        Relationships: []
      }
      org_analytics_events: {
        Row: {
          event_type: string
          id: string
          occurred_at: string
          organization_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          event_type: string
          id?: string
          occurred_at?: string
          organization_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          organization_id: string
          role_at_org: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role_at_org?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role_at_org?: string
          status?: string
        }
        Relationships: []
      }
      organization_claims: {
        Row: {
          claimant_email: string
          claimant_name: string
          claimant_phone: string | null
          claimant_role: string | null
          claimant_user_id: string | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          claimant_email: string
          claimant_name: string
          claimant_phone?: string | null
          claimant_role?: string | null
          claimant_user_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          claimant_email?: string
          claimant_name?: string
          claimant_phone?: string | null
          claimant_role?: string | null
          claimant_user_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_claims_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_join_requests: {
        Row: {
          created_at: string
          email: string
          email_domain: string
          id: string
          organization_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          role_at_org: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          email_domain: string
          id?: string
          organization_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_at_org?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          email_domain?: string
          id?: string
          organization_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_at_org?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role_at_org: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role_at_org?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role_at_org?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          announcement: string | null
          bd_contact_email: string | null
          bd_contact_name: string | null
          bd_contact_phone: string | null
          billing_email: string | null
          brand_color: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          cta_primary_label: string | null
          cta_secondary_label: string | null
          description: string | null
          email_domain: string | null
          favicon_url: string | null
          footer_image_url: string | null
          hq_city: string | null
          hq_state: string | null
          id: string
          image_urls: string[]
          is_published: boolean
          logo_url: string | null
          name: string
          num_facilities: number | null
          phone: string | null
          program_badges: string[]
          setup_package: string | null
          slug: string | null
          social_facebook_url: string | null
          social_instagram_url: string | null
          social_linkedin_url: string | null
          social_x_url: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          subscription_price_id: string | null
          subscription_status: string
          tagline: string | null
          updated_at: string
          verified: boolean
          website: string | null
          why_refer: Json
        }
        Insert: {
          accent_color?: string | null
          announcement?: string | null
          bd_contact_email?: string | null
          bd_contact_name?: string | null
          bd_contact_phone?: string | null
          billing_email?: string | null
          brand_color?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cta_primary_label?: string | null
          cta_secondary_label?: string | null
          description?: string | null
          email_domain?: string | null
          favicon_url?: string | null
          footer_image_url?: string | null
          hq_city?: string | null
          hq_state?: string | null
          id?: string
          image_urls?: string[]
          is_published?: boolean
          logo_url?: string | null
          name: string
          num_facilities?: number | null
          phone?: string | null
          program_badges?: string[]
          setup_package?: string | null
          slug?: string | null
          social_facebook_url?: string | null
          social_instagram_url?: string | null
          social_linkedin_url?: string | null
          social_x_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_price_id?: string | null
          subscription_status?: string
          tagline?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
          why_refer?: Json
        }
        Update: {
          accent_color?: string | null
          announcement?: string | null
          bd_contact_email?: string | null
          bd_contact_name?: string | null
          bd_contact_phone?: string | null
          billing_email?: string | null
          brand_color?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cta_primary_label?: string | null
          cta_secondary_label?: string | null
          description?: string | null
          email_domain?: string | null
          favicon_url?: string | null
          footer_image_url?: string | null
          hq_city?: string | null
          hq_state?: string | null
          id?: string
          image_urls?: string[]
          is_published?: boolean
          logo_url?: string | null
          name?: string
          num_facilities?: number | null
          phone?: string | null
          program_badges?: string[]
          setup_package?: string | null
          slug?: string | null
          social_facebook_url?: string | null
          social_instagram_url?: string | null
          social_linkedin_url?: string | null
          social_x_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_price_id?: string | null
          subscription_status?: string
          tagline?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
          why_refer?: Json
        }
        Relationships: []
      }
      payers: {
        Row: {
          active: boolean
          aliases: string[]
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          parent_company: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["payer_status"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          aliases?: string[]
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_company?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payer_status"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          aliases?: string[]
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_company?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payer_status"]
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_urls: string[]
          organization_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_urls?: string[]
          organization_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_urls?: string[]
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      preferred_provider_changes: {
        Row: {
          created_at: string
          enabled: boolean
          expires_at: string | null
          facility_id: string
          id: string
          set_by: string
        }
        Insert: {
          created_at?: string
          enabled: boolean
          expires_at?: string | null
          facility_id: string
          id?: string
          set_by: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          facility_id?: string
          id?: string
          set_by?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_network: {
        Row: {
          created_at: string
          id: string
          initiated_by: string | null
          owner_org_id: string
          partner_org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          initiated_by?: string | null
          owner_org_id: string
          partner_org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          initiated_by?: string | null
          owner_org_id?: string
          partner_org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_network_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_network_partner_org_id_fkey"
            columns: ["partner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          id: string
          livemode: boolean | null
          type: string
        }
        Insert: {
          created_at?: string
          id: string
          livemode?: boolean | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          livemode?: boolean | null
          type?: string
        }
        Relationships: []
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
      verification_reminders: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          organization_id: string
          reason: string
          recipient_user_id: string | null
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          organization_id: string
          reason?: string
          recipient_user_id?: string | null
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          organization_id?: string
          reason?: string
          recipient_user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      admin_assign_user_to_organization: {
        Args: {
          _email: string
          _organization_id: string
          _role_at_org?: string
        }
        Returns: Json
      }
      admin_create_organization: {
        Args: {
          _bd_contact_email?: string
          _bd_contact_name?: string
          _bd_contact_phone?: string
          _description?: string
          _email_domain?: string
          _hq_city?: string
          _hq_state?: string
          _logo_url?: string
          _name: string
          _num_facilities?: number
          _phone?: string
          _verified?: boolean
          _website?: string
        }
        Returns: string
      }
      approve_personal_email: {
        Args: { _email: string; _notes?: string }
        Returns: undefined
      }
      bootstrap_super_admin: { Args: never; Returns: boolean }
      cl_abbr: { Args: { a: string }; Returns: string }
      cl_loc: { Args: { v: string }; Returns: string }
      cl_payer: { Args: { v0: string }; Returns: string }
      cl_rank: { Args: { v: string }; Returns: number }
      cl_spec: { Args: { v: string }; Returns: string }
      cl_state: { Args: { a: string }; Returns: string }
      claim_pending_org_invite: { Args: never; Returns: Json }
      consume_access_request_rate_limit: {
        Args: {
          _fingerprint: string
          _max_attempts: number
          _window_seconds: number
        }
        Returns: boolean
      }
      create_org_invite: {
        Args: {
          _email: string
          _organization_id: string
          _role_at_org?: string
        }
        Returns: string
      }
      create_organization_with_owner: {
        Args: {
          _description?: string
          _email_domain: string
          _hq_city?: string
          _hq_state?: string
          _logo_url?: string
          _name: string
          _num_facilities?: number
          _phone?: string
          _website?: string
        }
        Returns: string
      }
      db_session_is_privileged_writer: { Args: never; Returns: boolean }
      email_signup_eligible: { Args: { _email: string }; Returns: boolean }
      facility_pdf_object_org_id: {
        Args: { object_name: string }
        Returns: string
      }
      freeze_stale_facilities: { Args: never; Returns: number }
      get_networked_org_ids: { Args: never; Returns: string[] }
      get_or_create_direct_conversation: {
        Args: { _other_user_id: string }
        Returns: string
      }
      get_org_engagement_stats: {
        Args: { _org_id: string }
        Returns: {
          call_clicks: number
          call_clicks_30d: number
          email_clicks: number
          email_clicks_30d: number
          page_views: number
          page_views_30d: number
          referral_clicks: number
          referral_clicks_30d: number
          share_clicks: number
          share_clicks_30d: number
          text_clicks: number
          text_clicks_30d: number
        }[]
      }
      get_org_setup_options: { Args: never; Returns: Json }
      get_organization_billing: { Args: { _org_id: string }; Returns: Json }
      get_public_org_sheet: { Args: { _slug: string }; Returns: Json }
      get_public_program_sheet: {
        Args: { _org_slug?: string; _slug: string }
        Returns: Json
      }
      get_user_org: { Args: { _user_id: string }; Returns: string }
      get_user_org_id: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_bootstrap_admin_candidate: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_email_auth_allowed: { Args: { _email: string }; Returns: boolean }
      is_org_facility_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_personal_email_domain: { Args: { _email: string }; Returns: boolean }
      link_user_to_organization: {
        Args: {
          _invited_by?: string
          _organization_id: string
          _role_at_org?: string
          _user_id: string
        }
        Returns: undefined
      }
      list_facilities_due_for_verification: {
        Args: { _days?: number }
        Returns: {
          contracts_verified_at: string
          facility_id: string
          facility_name: string
          organization_id: string
        }[]
      }
      list_org_join_requests: {
        Args: { _organization_id: string }
        Returns: {
          created_at: string
          email: string
          email_domain: string
          full_name: string
          id: string
          organization_id: string
          role_at_org: string
          status: string
          user_id: string
        }[]
      }
      list_superadmin_join_requests: {
        Args: never
        Returns: {
          created_at: string
          email: string
          email_domain: string
          full_name: string
          id: string
          org_has_admin: boolean
          organization_id: string
          organization_name: string
          role_at_org: string
          status: string
          user_id: string
        }[]
      }
      org_has_facility_admin: { Args: { _org_id: string }; Returns: boolean }
      q: { Args: { t: string }; Returns: string }
      remove_org_member: {
        Args: { _member_user_id: string; _organization_id: string }
        Returns: undefined
      }
      request_to_join_organization: {
        Args: { _organization_id: string }
        Returns: string
      }
      review_organization_join_request: {
        Args: { _approve: boolean; _request_id: string }
        Returns: boolean
      }
      revoke_org_invite: { Args: { _invite_id: string }; Returns: undefined }
      run_sql: { Args: { query: string }; Returns: Json }
      save_facility_with_contracts: {
        Args: {
          _contracts?: Json
          _contracts_mode?: string
          _facility: Json
          _facility_id?: string
          _organization_id: string
        }
        Returns: string
      }
      slugify: { Args: { _input: string }; Returns: string }
      stamp_facility_verified: {
        Args: { _facility_id: string }
        Returns: undefined
      }
      update_organization_profile: {
        Args: { _organization_id: string; _profile: Json }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "facility_admin" | "bd_rep"
      org_role: "system_admin" | "org_admin" | "bd_rep"
      payer_status: "pending" | "approved" | "rejected"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["super_admin", "facility_admin", "bd_rep"],
      org_role: ["system_admin", "org_admin", "bd_rep"],
      payer_status: ["pending", "approved", "rejected"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
