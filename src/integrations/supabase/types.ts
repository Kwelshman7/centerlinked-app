export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      contract_verifications: {
        Row: { action: string; created_at: string; facility_id: string; id: string; notes: string | null; user_id: string }
        Insert: { action: string; created_at?: string; facility_id: string; id?: string; notes?: string | null; user_id: string }
        Update: { action?: string; created_at?: string; facility_id?: string; id?: string; notes?: string | null; user_id?: string }
        Relationships: []
      }
      conversation_participants: {
        Row: { conversation_id: string; created_at: string; id: string; last_read_at: string; user_id: string }
        Insert: { conversation_id: string; created_at?: string; id?: string; last_read_at?: string; user_id: string }
        Update: { conversation_id?: string; created_at?: string; id?: string; last_read_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: 'conversation_participants_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }]
      }
      conversations: {
        Row: { created_at: string; created_by: string; id: string; last_message_at: string }
        Insert: { created_at?: string; created_by: string; id?: string; last_message_at?: string }
        Update: { created_at?: string; created_by?: string; id?: string; last_message_at?: string }
        Relationships: []
      }
      early_access_leads: {
        Row: { created_at: string; email: string; facilities: string; full_name: string; id: string; organization: string }
        Insert: { created_at?: string; email: string; facilities: string; full_name: string; id?: string; organization: string }
        Update: { created_at?: string; email?: string; facilities?: string; full_name?: string; id?: string; organization?: string }
        Relationships: []
      }
      facilities: {
        Row: { accreditations: string[]; address_line1: string | null; address_line2: string | null; bd_contact_email: string | null; bd_contact_name: string | null; bd_contact_phone: string | null; capacity: number | null; city: string | null; contracts_verified_at: string | null; contracts_verified_by: string | null; created_at: string; description: string | null; featured_payer: string | null; highlights: string[]; id: string; image_urls: string[]; insurance_status: string | null; levels_of_care: string[]; name: string; organization_id: string; phone: string | null; population_served: string[]; preferred_provider: boolean; preferred_until: string | null; quick_highlights: string[]; rejection_reason: string | null; short_description: string | null; slug: string | null; specializations: string[]; state: string | null; submitted_by: string | null; tagline: string | null; treatment_focus: string | null; updated_at: string; verification_frozen: boolean; verification_status: Database['public']['Enums']['verification_status']; verified_at: string | null; verified_by: string | null; website: string | null; zip: string | null }
        Insert: { accreditations?: string[]; address_line1?: string | null; address_line2?: string | null; bd_contact_email?: string | null; bd_contact_name?: string | null; bd_contact_phone?: string | null; capacity?: number | null; city?: string | null; contracts_verified_at?: string | null; contracts_verified_by?: string | null; created_at?: string; description?: string | null; featured_payer?: string | null; highlights?: string[]; id?: string; image_urls?: string[]; insurance_status?: string | null; levels_of_care?: string[]; name: string; organization_id: string; phone?: string | null; population_served?: string[]; preferred_provider?: boolean; preferred_until?: string | null; quick_highlights?: string[]; rejection_reason?: string | null; short_description?: string | null; slug?: string | null; specializations?: string[]; state?: string | null; submitted_by?: string | null; tagline?: string | null; treatment_focus?: string | null; updated_at?: string; verification_frozen?: boolean; verification_status?: Database['public']['Enums']['verification_status']; verified_at?: string | null; verified_by?: string | null; website?: string | null; zip?: string | null }
        Update: { accreditations?: string[]; address_line1?: string | null; address_line2?: string | null; bd_contact_email?: string | null; bd_contact_name?: string | null; bd_contact_phone?: string | null; capacity?: number | null; city?: string | null; contracts_verified_at?: string | null; contracts_verified_by?: string | null; created_at?: string; description?: string | null; featured_payer?: string | null; highlights?: string[]; id?: string; image_urls?: string[]; insurance_status?: string | null; levels_of_care?: string[]; name?: string; organization_id?: string; phone?: string | null; population_served?: string[]; preferred_provider?: boolean; preferred_until?: string | null; quick_highlights?: string[]; rejection_reason?: string | null; short_description?: string | null; slug?: string | null; specializations?: string[]; state?: string | null; submitted_by?: string | null; tagline?: string | null; treatment_focus?: string | null; updated_at?: string; verification_frozen?: boolean; verification_status?: Database['public']['Enums']['verification_status']; verified_at?: string | null; verified_by?: string | null; website?: string | null; zip?: string | null }
        Relationships: [{ foreignKeyName: 'facilities_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }]
      }
      insurance_contracts: {
        Row: { created_at: string; facility_id: string; id: string; in_network: boolean; notes: string | null; payer_id: string | null; payer_name: string; plan_types: string[]; updated_at: string }
        Insert: { created_at?: string; facility_id: string; id?: string; in_network?: boolean; notes?: string | null; payer_id?: string | null; payer_name: string; plan_types?: string[]; updated_at?: string }
        Update: { created_at?: string; facility_id?: string; id?: string; in_network?: boolean; notes?: string | null; payer_id?: string | null; payer_name?: string; plan_types?: string[]; updated_at?: string }
        Relationships: [{ foreignKeyName: 'insurance_contracts_facility_id_fkey'; columns: ['facility_id']; isOneToOne: false; referencedRelation: 'facilities'; referencedColumns: ['id'] }, { foreignKeyName: 'insurance_contracts_payer_id_fkey'; columns: ['payer_id']; isOneToOne: false; referencedRelation: 'payers'; referencedColumns: ['id'] }]
      }
      messages: {
        Row: { content: string; conversation_id: string; created_at: string; id: string; sender_id: string }
        Insert: { content: string; conversation_id: string; created_at?: string; id?: string; sender_id: string }
        Update: { content?: string; conversation_id?: string; created_at?: string; id?: string; sender_id?: string }
        Relationships: [{ foreignKeyName: 'messages_conversation_id_fkey'; columns: ['conversation_id']; isOneToOne: false; referencedRelation: 'conversations'; referencedColumns: ['id'] }]
      }
      org_analytics_events: {
        Row: { event_type: string; id: string; occurred_at: string; organization_id: string; referrer: string | null; session_id: string | null; user_agent: string | null }
        Insert: { event_type: string; id?: string; occurred_at?: string; organization_id: string; referrer?: string | null; session_id?: string | null; user_agent?: string | null }
        Update: { event_type?: string; id?: string; occurred_at?: string; organization_id?: string; referrer?: string | null; session_id?: string | null; user_agent?: string | null }
        Relationships: [{ foreignKeyName: 'org_analytics_events_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }]
      }
      org_invites: {
        Row: { accepted_at: string | null; created_at: string; email: string; id: string; invited_by: string | null; organization_id: string; role_at_org: string; status: string }
        Insert: { accepted_at?: string | null; created_at?: string; email: string; id?: string; invited_by?: string | null; organization_id: string; role_at_org?: string; status?: string }
        Update: { accepted_at?: string | null; created_at?: string; email?: string; id?: string; invited_by?: string | null; organization_id?: string; role_at_org?: string; status?: string }
        Relationships: []
      }
      organization_claims: {
        Row: { claimant_email: string; claimant_name: string; claimant_phone: string | null; claimant_role: string | null; claimant_user_id: string | null; created_at: string; id: string; notes: string | null; organization_id: string; proof_url: string | null; reviewed_at: string | null; reviewed_by: string | null; status: string; updated_at: string }
        Insert: { claimant_email: string; claimant_name: string; claimant_phone?: string | null; claimant_role?: string | null; claimant_user_id?: string | null; created_at?: string; id?: string; notes?: string | null; organization_id: string; proof_url?: string | null; reviewed_at?: string | null; reviewed_by?: string | null; status?: string; updated_at?: string }
        Update: { claimant_email?: string; claimant_name?: string; claimant_phone?: string | null; claimant_role?: string | null; claimant_user_id?: string | null; created_at?: string; id?: string; notes?: string | null; organization_id?: string; proof_url?: string | null; reviewed_at?: string | null; reviewed_by?: string | null; status?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: 'organization_claims_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }]
      }
      organization_members: {
        Row: { created_at: string; id: string; invited_by: string | null; organization_id: string; role_at_org: string; user_id: string }
        Insert: { created_at?: string; id?: string; invited_by?: string | null; organization_id: string; role_at_org?: string; user_id: string }
        Update: { created_at?: string; id?: string; invited_by?: string | null; organization_id?: string; role_at_org?: string; user_id?: string }
        Relationships: [{ foreignKeyName: 'organization_members_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }]
      }
      organizations: {
        Row: { accent_color: string | null; announcement: string | null; bd_contact_email: string | null; bd_contact_name: string | null; bd_contact_phone: string | null; brand_color: string | null; cover_image_url: string | null; created_at: string; created_by: string | null; cta_primary_label: string | null; cta_secondary_label: string | null; description: string | null; email_domain: string | null; hq_city: string | null; hq_state: string | null; id: string; logo_url: string | null; name: string; num_facilities: number | null; phone: string | null; program_badges: string[]; slug: string | null; tagline: string | null; updated_at: string; verified: boolean; website: string | null; why_refer: Json }
        Insert: { accent_color?: string | null; announcement?: string | null; bd_contact_email?: string | null; bd_contact_name?: string | null; bd_contact_phone?: string | null; brand_color?: string | null; cover_image_url?: string | null; created_at?: string; created_by?: string | null; cta_primary_label?: string | null; cta_secondary_label?: string | null; description?: string | null; email_domain?: string | null; hq_city?: string | null; hq_state?: string | null; id?: string; logo_url?: string | null; name: string; num_facilities?: number | null; phone?: string | null; program_badges?: string[]; slug?: string | null; tagline?: string | null; updated_at?: string; verified?: boolean; website?: string | null; why_refer?: Json }
        Update: { accent_color?: string | null; announcement?: string | null; bd_contact_email?: string | null; bd_contact_name?: string | null; bd_contact_phone?: string | null; brand_color?: string | null; cover_image_url?: string | null; created_at?: string; created_by?: string | null; cta_primary_label?: string | null; cta_secondary_label?: string | null; description?: string | null; email_domain?: string | null; hq_city?: string | null; hq_state?: string | null; id?: string; logo_url?: string | null; name?: string; num_facilities?: number | null; phone?: string | null; program_badges?: string[]; slug?: string | null; tagline?: string | null; updated_at?: string; verified?: boolean; website?: string | null; why_refer?: Json }
        Relationships: []
      }
      payers: {
        Row: { active: boolean; aliases: string[]; approved_at: string | null; approved_by: string | null; category: string; created_at: string; created_by: string | null; id: string; name: string; notes: string | null; parent_company: string | null; rejection_reason: string | null; status: Database['public']['Enums']['payer_status']; updated_at: string }
        Insert: { active?: boolean; aliases?: string[]; approved_at?: string | null; approved_by?: string | null; category?: string; created_at?: string; created_by?: string | null; id?: string; name: string; notes?: string | null; parent_company?: string | null; rejection_reason?: string | null; status?: Database['public']['Enums']['payer_status']; updated_at?: string }
        Update: { active?: boolean; aliases?: string[]; approved_at?: string | null; approved_by?: string | null; category?: string; created_at?: string; created_by?: string | null; id?: string; name?: string; notes?: string | null; parent_company?: string | null; rejection_reason?: string | null; status?: Database['public']['Enums']['payer_status']; updated_at?: string }
        Relationships: []
      }
      post_likes: {
        Row: { created_at: string; id: string; post_id: string; user_id: string }
        Insert: { created_at?: string; id?: string; post_id: string; user_id: string }
        Update: { created_at?: string; id?: string; post_id?: string; user_id?: string }
        Relationships: [{ foreignKeyName: 'post_likes_post_id_fkey'; columns: ['post_id']; isOneToOne: false; referencedRelation: 'posts'; referencedColumns: ['id'] }]
      }
      posts: {
        Row: { author_id: string; content: string; created_at: string; id: string; image_urls: string[]; organization_id: string; updated_at: string }
        Insert: { author_id: string; content: string; created_at?: string; id?: string; image_urls?: string[]; organization_id: string; updated_at?: string }
        Update: { author_id?: string; content?: string; created_at?: string; id?: string; image_urls?: string[]; organization_id?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: 'posts_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }]
      }
      preferred_provider_changes: {
        Row: { created_at: string; enabled: boolean; expires_at: string | null; facility_id: string; id: string; set_by: string }
        Insert: { created_at?: string; enabled: boolean; expires_at?: string | null; facility_id: string; id?: string; set_by: string }
        Update: { created_at?: string; enabled?: boolean; expires_at?: string | null; facility_id?: string; id?: string; set_by?: string }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; email: string | null; full_name: string | null; id: string; job_title: string | null; organization_id: string | null; phone: string | null; updated_at: string; user_id: string }
        Insert: { avatar_url?: string | null; created_at?: string; email?: string | null; full_name?: string | null; id?: string; job_title?: string | null; organization_id?: string | null; phone?: string | null; updated_at?: string; user_id: string }
        Update: { avatar_url?: string | null; created_at?: string; email?: string | null; full_name?: string | null; id?: string; job_title?: string | null; organization_id?: string | null; phone?: string | null; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: 'profiles_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }]
      }
      referral_network: {
        Row: { created_at: string; id: string; initiated_by: string | null; owner_org_id: string; partner_org_id: string; status: string; updated_at: string }
        Insert: { created_at?: string; id?: string; initiated_by?: string | null; owner_org_id: string; partner_org_id: string; status?: string; updated_at?: string }
        Update: { created_at?: string; id?: string; initiated_by?: string | null; owner_org_id?: string; partner_org_id?: string; status?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: 'referral_network_owner_org_id_fkey'; columns: ['owner_org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }, { foreignKeyName: 'referral_network_partner_org_id_fkey'; columns: ['partner_org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }]
      }
      user_roles: {
        Row: { created_at: string; id: string; role: Database['public']['Enums']['app_role']; user_id: string }
        Insert: { created_at?: string; id?: string; role: Database['public']['Enums']['app_role']; user_id: string }
        Update: { created_at?: string; id?: string; role?: Database['public']['Enums']['app_role']; user_id?: string }
        Relationships: []
      }
      verification_reminders: {
        Row: { created_at: string; facility_id: string; id: string; organization_id: string; reason: string; recipient_user_id: string | null }
        Insert: { created_at?: string; facility_id: string; id?: string; organization_id: string; reason?: string; recipient_user_id?: string | null }
        Update: { created_at?: string; facility_id?: string; id?: string; organization_id?: string; reason?: string; recipient_user_id?: string | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      admin_create_organization: { Args: { _bd_contact_email?: string; _bd_contact_name?: string; _bd_contact_phone?: string; _description?: string; _email_domain?: string; _hq_city?: string; _hq_state?: string; _logo_url?: string; _name: string; _num_facilities?: number; _phone?: string; _verified?: boolean; _website?: string }; Returns: string }
      create_organization_with_owner: { Args: { _description?: string; _email_domain: string; _hq_city?: string; _hq_state?: string; _logo_url?: string; _name: string; _num_facilities?: number; _phone?: string; _website?: string }; Returns: string }
      freeze_stale_facilities: { Args: Record<PropertyKey, never>; Returns: number }
      get_networked_org_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
      get_or_create_direct_conversation: { Args: { _other_user_id: string }; Returns: string }
      get_org_engagement_stats: { Args: { _org_id: string }; Returns: { call_clicks: number; call_clicks_30d: number; email_clicks: number; email_clicks_30d: number; page_views: number; page_views_30d: number; referral_clicks: number; referral_clicks_30d: number; share_clicks: number; share_clicks_30d: number; text_clicks: number; text_clicks_30d: number }[] }
      get_user_org: { Args: { _user_id: string }; Returns: string }
      has_role: { Args: { _role: Database['public']['Enums']['app_role']; _user_id: string }; Returns: boolean }
      is_conversation_participant: { Args: { _conversation_id: string; _user_id: string }; Returns: boolean }
      is_org_member: { Args: { _org_id: string; _user_id: string }; Returns: boolean }
      is_personal_email_domain: { Args: { _email: string }; Returns: boolean }
      list_facilities_due_for_verification: { Args: { _days?: number }; Returns: { contracts_verified_at: string; facility_id: string; facility_name: string; organization_id: string }[] }
      run_sql: { Args: { query: string }; Returns: Json }
      slugify: { Args: { _input: string }; Returns: string }
    }
    Enums: {
      app_role: 'super_admin' | 'facility_admin' | 'bd_rep'
      payer_status: 'pending' | 'approved' | 'rejected'
      verification_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<T extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])> =
  (DefaultSchema['Tables'] & DefaultSchema['Views'])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T]

export const Constants = {
  public: {
    Enums: {
      app_role: ['super_admin', 'facility_admin', 'bd_rep'],
      payer_status: ['pending', 'approved', 'rejected'],
      verification_status: ['pending', 'approved', 'rejected'],
    },
  },
} as const
