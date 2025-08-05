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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          permissions: Json | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          last_login?: string | null
          name: string
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ejcon_admins: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string
          password: string
          permissions: Json | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          password?: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          password?: string
          permissions?: Json | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      members: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string | null
          group_id: string | null
          id: string
          join_date: string | null
          name: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          group_id?: string | null
          id?: string
          join_date?: string | null
          name: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          group_id?: string | null
          id?: string
          join_date?: string | null
          name?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      message_groups: {
        Row: {
          created_at: string | null
          group_id: string | null
          id: string
          message_id: string | null
        }
        Insert: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message_id?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string | null
          id?: string
          message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_groups_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          id: string
          member_id: string | null
          message_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          member_id?: string | null
          message_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          member_id?: string | null
          message_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          delivered_count: number | null
          id: string
          sent_at: string | null
          status: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          sent_at?: string | null
          status?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          sent_at?: string | null
          status?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nana_admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      nana_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      nana_chat_messages: {
        Row: {
          chat_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "nana_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_chats: {
        Row: {
          admin_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_chats_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "nana_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nana_chats_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "nana_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          national_id: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          national_id?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          national_id?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      nana_foods: {
        Row: {
          category_id: string | null
          created_at: string
          delivery_price: number
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          delivery_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          delivery_price?: number
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_foods_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "nana_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_order_items: {
        Row: {
          created_at: string
          food_id: string | null
          id: string
          order_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          food_id?: string | null
          id?: string
          order_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          food_id?: string | null
          id?: string
          order_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "nana_order_items_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "nana_foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nana_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "nana_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_orders: {
        Row: {
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_fee: number
          id: string
          notes: string | null
          order_type: string
          payment_reference: string | null
          payment_status: string
          rejected_at: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_type: string
          payment_reference?: string | null
          payment_status?: string
          rejected_at?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          order_type?: string
          payment_reference?: string | null
          payment_status?: string
          rejected_at?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nana_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "nana_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      nana_profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_login: {
        Args: { admin_email: string; admin_password: string }
        Returns: Json
      }
      cleanup_old_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
