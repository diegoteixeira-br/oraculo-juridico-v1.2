export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: string | null
          stripe_session_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          id: string
          shared_by: string
          target_group_id: string | null
          target_user_id: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          shared_by: string
          target_group_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          shared_by?: string
          target_group_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents_library"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_library: {
        Row: {
          bucket_id: string
          content: string | null
          created_at: string
          doc_type: string
          file_url: string | null
          folder: string | null
          id: string
          is_active: boolean
          object_path: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          bucket_id?: string
          content?: string | null
          created_at?: string
          doc_type?: string
          file_url?: string | null
          folder?: string | null
          id?: string
          is_active?: boolean
          object_path?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          bucket_id?: string
          content?: string | null
          created_at?: string
          doc_type?: string
          file_url?: string | null
          folder?: string | null
          id?: string
          is_active?: boolean
          object_path?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          created_at: string
          feature_data: Json | null
          feature_name: string
          id: string
          tokens_consumed: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_data?: Json | null
          feature_name: string
          id?: string
          tokens_consumed?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature_data?: Json | null
          feature_name?: string
          id?: string
          tokens_consumed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      legal_commitments: {
        Row: {
          alert_sent: boolean | null
          auto_detected: boolean | null
          client_name: string | null
          commitment_date: string
          commitment_type: string
          created_at: string
          deadline_type: string | null
          description: string | null
          end_date: string | null
          extracted_text: string | null
          id: string
          is_virtual: boolean | null
          location: string | null
          priority: string | null
          process_number: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_sent?: boolean | null
          auto_detected?: boolean | null
          client_name?: string | null
          commitment_date: string
          commitment_type: string
          created_at?: string
          deadline_type?: string | null
          description?: string | null
          end_date?: string | null
          extracted_text?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          priority?: string | null
          process_number?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_sent?: boolean | null
          auto_detected?: boolean | null
          client_name?: string | null
          commitment_date?: string
          commitment_type?: string
          created_at?: string
          deadline_type?: string | null
          description?: string | null
          end_date?: string | null
          extracted_text?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          priority?: string | null
          process_number?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean
          margins: Json | null
          min_tokens_required: number | null
          paper_id: string | null
          template_variables: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          margins?: Json | null
          min_tokens_required?: number | null
          paper_id?: string | null
          template_variables?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          margins?: Json | null
          min_tokens_required?: number | null
          paper_id?: string | null
          template_variables?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          days_before_deadline: number | null
          email_enabled: boolean | null
          hours_before_commitment: number | null
          id: string
          push_enabled: boolean | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          days_before_deadline?: number | null
          email_enabled?: boolean | null
          hours_before_commitment?: number | null
          id?: string
          push_enabled?: boolean | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          days_before_deadline?: number | null
          email_enabled?: boolean | null
          hours_before_commitment?: number | null
          id?: string
          push_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_types: {
        Row: {
          billing_period: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number
          price_currency: string
          tokens_included: number
          updated_at: string
        }
        Insert: {
          billing_period?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          price_currency?: string
          tokens_included?: number
          updated_at?: string
        }
        Update: {
          billing_period?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          price_currency?: string
          tokens_included?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          last_renewal_date: string | null
          plan_tokens: number | null
          plan_type: string | null
          receber_notificacao_agenda: boolean
          subscription_activated_at: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          timezone: string | null
          token_balance: number | null
          token_expiry_date: string | null
          tokens: number | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_renewal_date?: string | null
          plan_tokens?: number | null
          plan_type?: string | null
          receber_notificacao_agenda?: boolean
          subscription_activated_at?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          timezone?: string | null
          token_balance?: number | null
          token_expiry_date?: string | null
          tokens?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_renewal_date?: string | null
          plan_tokens?: number | null
          plan_type?: string | null
          receber_notificacao_agenda?: boolean
          subscription_activated_at?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          timezone?: string | null
          token_balance?: number | null
          token_expiry_date?: string | null
          tokens?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_cents: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_method: string | null
          product_type_id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tokens_granted: number
          user_id: string
        }
        Insert: {
          amount_cents: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_type_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tokens_granted: number
          user_id: string
        }
        Update: {
          amount_cents?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          product_type_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tokens_granted?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      query_history: {
        Row: {
          attached_files: Json | null
          created_at: string
          credits_consumed: number | null
          id: string
          message_type: string | null
          prompt_text: string
          response_text: string | null
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attached_files?: Json | null
          created_at?: string
          credits_consumed?: number | null
          id?: string
          message_type?: string | null
          prompt_text: string
          response_text?: string | null
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attached_files?: Json | null
          created_at?: string
          credits_consumed?: number | null
          id?: string
          message_type?: string | null
          prompt_text?: string
          response_text?: string | null
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_document_access: {
        Row: {
          access_type: string
          created_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_document_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          content_md: string
          created_at: string
          folder: string | null
          id: string
          margins: Json | null
          paper_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_md?: string
          created_at?: string
          folder?: string | null
          id?: string
          margins?: Json | null
          paper_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_md?: string
          created_at?: string
          folder?: string | null
          id?: string
          margins?: Json | null
          paper_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits_to_user: {
        Args:
          | {
              p_user_id: string
              p_credits: number
              p_transaction_id?: string
              p_description?: string
            }
          | {
              p_user_id: string
              p_credits: number
              p_transaction_id?: string
              p_description?: string
            }
        Returns: boolean
      }
      add_tokens_to_user: {
        Args: {
          p_user_id: string
          p_tokens: number
          p_plan_type: string
          p_transaction_id?: string
          p_description?: string
        }
        Returns: boolean
      }
      add_tokens_to_user_v2: {
        Args: {
          p_user_id: string
          p_product_type_id: string
          p_stripe_session_id?: string
          p_payment_intent_id?: string
        }
        Returns: boolean
      }
      admin_add_tokens_to_user: {
        Args: { p_user_id: string; p_tokens: number; p_description?: string }
        Returns: boolean
      }
      admin_remove_tokens_from_user: {
        Args: { p_user_id: string; p_tokens: number; p_description?: string }
        Returns: boolean
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_and_expire_tokens: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_document_access: {
        Args: { p_document_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_feature_usage: {
        Args: {
          p_user_id: string
          p_feature_name: string
          p_feature_data?: Json
          p_tokens_consumed?: number
        }
        Returns: boolean
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      process_refund: {
        Args: {
          p_user_id: string
          p_refunded_credits: number
          p_transaction_id?: string
          p_description?: string
        }
        Returns: boolean
      }
      renew_monthly_subscription: {
        Args: { p_user_id: string; p_tokens: number; p_transaction_id: string }
        Returns: boolean
      }
      reset_daily_credits_if_needed: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      reset_trial_tokens_if_expired: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      use_credits: {
        Args:
          | { p_user_id: string; p_credits: number; p_description?: string }
          | { p_user_id: string; p_credits: number; p_description?: string }
        Returns: boolean
      }
      use_tokens: {
        Args: { p_user_id: string; p_tokens: number; p_description?: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
