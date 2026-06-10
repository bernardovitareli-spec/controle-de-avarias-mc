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
      avarias_auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      avarias_importacoes: {
        Row: {
          created_at: string
          data_importacao: string
          id: string
          nome_arquivo: string
          observacoes: string | null
          status_importacao: string
          total_duplicados: number
          total_linhas_lidas: number
          total_registros_ignorados: number
          total_registros_validos: number
          updated_at: string
          usuario_id: string | null
          valor_total_importado: number
        }
        Insert: {
          created_at?: string
          data_importacao?: string
          id?: string
          nome_arquivo: string
          observacoes?: string | null
          status_importacao?: string
          total_duplicados?: number
          total_linhas_lidas?: number
          total_registros_ignorados?: number
          total_registros_validos?: number
          updated_at?: string
          usuario_id?: string | null
          valor_total_importado?: number
        }
        Update: {
          created_at?: string
          data_importacao?: string
          id?: string
          nome_arquivo?: string
          observacoes?: string | null
          status_importacao?: string
          total_duplicados?: number
          total_linhas_lidas?: number
          total_registros_ignorados?: number
          total_registros_validos?: number
          updated_at?: string
          usuario_id?: string | null
          valor_total_importado?: number
        }
        Relationships: []
      }
      avarias_registros: {
        Row: {
          categoria: string | null
          chave_duplicidade: string | null
          contrato: string | null
          created_at: string
          data_envio: string | null
          id: string
          importacao_id: string
          nf_mc: string | null
          observacoes: string | null
          parecer_normalizado: string | null
          parecer_original: string | null
          placa: string | null
          status_normalizado: string | null
          status_original: string | null
          subcategoria: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          chave_duplicidade?: string | null
          contrato?: string | null
          created_at?: string
          data_envio?: string | null
          id?: string
          importacao_id: string
          nf_mc?: string | null
          observacoes?: string | null
          parecer_normalizado?: string | null
          parecer_original?: string | null
          placa?: string | null
          status_normalizado?: string | null
          status_original?: string | null
          subcategoria?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          chave_duplicidade?: string | null
          contrato?: string | null
          created_at?: string
          data_envio?: string | null
          id?: string
          importacao_id?: string
          nf_mc?: string | null
          observacoes?: string | null
          parecer_normalizado?: string | null
          parecer_original?: string | null
          placa?: string | null
          status_normalizado?: string | null
          status_original?: string | null
          subcategoria?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "avarias_registros_importacao_id_fkey"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "avarias_importacoes"
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
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          roles: string[]
          user_id: string
        }[]
      }
      clear_user_roles: { Args: { _target: string }; Returns: undefined }
      create_avarias_import: {
        Args: {
          p_nome_arquivo: string
          p_registros: Json
          p_total_linhas_lidas: number
          p_total_registros_ignorados: number
          p_valor_total_importado: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "leitor" | "apontador"
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
      app_role: ["admin", "gestor", "leitor", "apontador"],
    },
  },
} as const
