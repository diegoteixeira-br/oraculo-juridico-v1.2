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
      blog_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          dislikes_count: number | null
          featured: boolean
          id: string
          is_published: boolean
          likes_count: number | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_minutes: number | null
          slug: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          dislikes_count?: number | null
          featured?: boolean
          id?: string
          is_published?: boolean
          likes_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          dislikes_count?: number | null
          featured?: boolean
          id?: string
          is_published?: boolean
          likes_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          slug?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      blog_settings: {
        Row: {
          canonical_url: string | null
          created_at: string | null
          favicon: string | null
          google_adsense_client_id: string | null
          google_adsense_enabled: boolean | null
          google_analytics_id: string | null
          id: string
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          social_image: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string | null
          favicon?: string | null
          google_adsense_client_id?: string | null
          google_adsense_enabled?: boolean | null
          google_analytics_id?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          social_image?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          created_at?: string | null
          favicon?: string | null
          google_adsense_client_id?: string | null
          google_adsense_enabled?: boolean | null
          google_analytics_id?: string | null
          id?: string
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          social_image?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      calculo_contrato_historico: {
        Row: {
          created_at: string
          data_contrato: string
          data_pagamento_parcial: string | null
          data_vencimento: string
          detalhamento: string
          diferenca: number
          id: string
          indice_correcao: string
          juros_mora: number | null
          juros_total: number
          multa_atraso: number | null
          observacoes: string | null
          taxa_juros: number
          tipo_juros: string
          updated_at: string
          user_id: string
          valor_contrato: number
          valor_corrigido: number
          valor_pago: number | null
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_contrato: string
          data_pagamento_parcial?: string | null
          data_vencimento: string
          detalhamento: string
          diferenca: number
          id?: string
          indice_correcao: string
          juros_mora?: number | null
          juros_total: number
          multa_atraso?: number | null
          observacoes?: string | null
          taxa_juros: number
          tipo_juros: string
          updated_at?: string
          user_id: string
          valor_contrato: number
          valor_corrigido: number
          valor_pago?: number | null
          valor_total: number
        }
        Update: {
          created_at?: string
          data_contrato?: string
          data_pagamento_parcial?: string | null
          data_vencimento?: string
          detalhamento?: string
          diferenca?: number
          id?: string
          indice_correcao?: string
          juros_mora?: number | null
          juros_total?: number
          multa_atraso?: number | null
          observacoes?: string | null
          taxa_juros?: number
          tipo_juros?: string
          updated_at?: string
          user_id?: string
          valor_contrato?: number
          valor_corrigido?: number
          valor_pago?: number | null
          valor_total?: number
        }
        Relationships: []
      }
      calculo_pensao_historico: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          detalhamento: string
          id: string
          idades_filhos: Json
          juros: number
          meses_atraso: number | null
          multa: number
          numero_filhos: number
          observacoes: string | null
          percentual_pensao: number | null
          percentual_renda: number
          renda_alimentante: number | null
          tipo_calculo: string
          updated_at: string
          user_id: string
          valor_corrigido: number
          valor_fixo: number | null
          valor_pensao: number
          valor_total_atrasado: number
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          detalhamento: string
          id?: string
          idades_filhos?: Json
          juros: number
          meses_atraso?: number | null
          multa: number
          numero_filhos: number
          observacoes?: string | null
          percentual_pensao?: number | null
          percentual_renda: number
          renda_alimentante?: number | null
          tipo_calculo: string
          updated_at?: string
          user_id: string
          valor_corrigido: number
          valor_fixo?: number | null
          valor_pensao: number
          valor_total_atrasado: number
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          detalhamento?: string
          id?: string
          idades_filhos?: Json
          juros?: number
          meses_atraso?: number | null
          multa?: number
          numero_filhos?: number
          observacoes?: string | null
          percentual_pensao?: number | null
          percentual_renda?: number
          renda_alimentante?: number | null
          tipo_calculo?: string
          updated_at?: string
          user_id?: string
          valor_corrigido?: number
          valor_fixo?: number | null
          valor_pensao?: number
          valor_total_atrasado?: number
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
      custom_ads: {
        Row: {
          ad_type: string
          click_count: number
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          link_url: string | null
          position: string
          start_date: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ad_type: string
          click_count?: number
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          position: string
          start_date?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ad_type?: string
          click_count?: number
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          start_date?: string | null
          title?: string
          updated_at?: string
          view_count?: number
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
      email_templates: {
        Row: {
          created_at: string
          id: string
          template_html: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_html: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          template_html?: string
          template_name?: string
          updated_at?: string
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
      landing_page_settings: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          video_description: string | null
          video_enabled: boolean
          video_title: string | null
          youtube_video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          video_description?: string | null
          video_enabled?: boolean
          video_title?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          video_description?: string | null
          video_enabled?: boolean
          video_title?: string | null
          youtube_video_id?: string | null
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
          agenda_email_time: string | null
          agenda_timezone: string | null
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
          agenda_email_time?: string | null
          agenda_timezone?: string | null
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
          agenda_email_time?: string | null
          agenda_timezone?: string | null
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
      profile_access_logs: {
        Row: {
          access_type: string
          accessed_fields: string[] | null
          accessed_user_id: string
          accessor_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_fields?: string[] | null
          accessed_user_id: string
          accessor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_fields?: string[] | null
          accessed_user_id?: string
          accessor_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          last_renewal_date: string | null
          plan_tokens: number | null
          plan_type: string | null
          receber_notificacao_agenda: boolean
          stripe_customer_id: string | null
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
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_renewal_date?: string | null
          plan_tokens?: number | null
          plan_type?: string | null
          receber_notificacao_agenda?: boolean
          stripe_customer_id?: string | null
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
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_renewal_date?: string | null
          plan_tokens?: number | null
          plan_type?: string | null
          receber_notificacao_agenda?: boolean
          stripe_customer_id?: string | null
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
              p_credits: number
              p_description?: string
              p_transaction_id?: string
              p_user_id: string
            }
          | {
              p_credits: number
              p_description?: string
              p_transaction_id?: string
              p_user_id: string
            }
        Returns: boolean
      }
      add_tokens_to_user: {
        Args: {
          p_description?: string
          p_plan_type: string
          p_tokens: number
          p_transaction_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      add_tokens_to_user_v2: {
        Args: {
          p_payment_intent_id?: string
          p_product_type_id: string
          p_stripe_session_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      admin_add_tokens_to_user: {
        Args: { p_description?: string; p_tokens: number; p_user_id: string }
        Returns: boolean
      }
      admin_remove_tokens_from_user: {
        Args: { p_description?: string; p_tokens: number; p_user_id: string }
        Returns: boolean
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_and_block_expired_trials: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_and_expire_tokens: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      exec_sql: {
        Args: { sql: string }
        Returns: {
          result: string
        }[]
      }
      get_admin_user_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          is_active: boolean
          masked_cpf: string
          masked_full_name: string
          plan_type: string
          subscription_activated_at: string
          subscription_status: string
          tokens: number
          user_id: string
        }[]
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
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
      increment_ad_clicks: {
        Args: { ad_id: string }
        Returns: undefined
      }
      increment_ad_views: {
        Args: { ad_id: string }
        Returns: undefined
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
          p_feature_data?: Json
          p_feature_name: string
          p_tokens_consumed?: number
          p_user_id: string
        }
        Returns: boolean
      }
      log_sensitive_access: {
        Args: { access_type: string; accessed_user: string; fields: string[] }
        Returns: undefined
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      process_refund: {
        Args: {
          p_description?: string
          p_refunded_credits: number
          p_transaction_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      renew_monthly_subscription: {
        Args: { p_tokens: number; p_transaction_id: string; p_user_id: string }
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
      schedule_daily_agenda_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      secure_update_profile: {
        Args: {
          new_cpf?: string
          new_full_name?: string
          new_timezone?: string
          profile_user_id: string
        }
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
          | { p_credits: number; p_description?: string; p_user_id: string }
          | { p_credits: number; p_description?: string; p_user_id: string }
        Returns: boolean
      }
      use_tokens: {
        Args: { p_description?: string; p_tokens: number; p_user_id: string }
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
