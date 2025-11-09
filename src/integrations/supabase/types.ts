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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cart: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          actual_delivery: string | null
          created_at: string
          delivery_notes: string | null
          driver_id: string | null
          driver_notes: string | null
          estimated_delivery: string | null
          id: string
          order_id: string
          pickup_time: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string
          delivery_notes?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery?: string | null
          id?: string
          order_id: string
          pickup_time?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string
          delivery_notes?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery?: string | null
          id?: string
          order_id?: string
          pickup_time?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      driver_assignments: {
        Row: {
          accepted_at: string | null
          assigned_driver_id: string | null
          available_drivers: string[]
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          order_ids: string[]
          status: string
          store_id: string
          total_orders: number
          total_value: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_driver_id?: string | null
          available_drivers: string[]
          completed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          order_ids: string[]
          status?: string
          store_id: string
          total_orders?: number
          total_value?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_driver_id?: string | null
          available_drivers?: string[]
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          order_ids?: string[]
          status?: string
          store_id?: string
          total_orders?: number
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_assignments_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivery_address: string
          delivery_city: string
          delivery_fee: number
          delivery_instructions: string | null
          delivery_postal_code: string | null
          estimated_delivery: string | null
          fulfilled_by_employee: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          phone: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivery_address: string
          delivery_city: string
          delivery_fee?: number
          delivery_instructions?: string | null
          delivery_postal_code?: string | null
          estimated_delivery?: string | null
          fulfilled_by_employee?: string | null
          id?: string
          items: Json
          notes?: string | null
          order_number: string
          phone: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax_amount?: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_city?: string
          delivery_fee?: number
          delivery_instructions?: string | null
          delivery_postal_code?: string | null
          estimated_delivery?: string | null
          fulfilled_by_employee?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          phone?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          price: number
          stock: number
          unit: string
          image_url: string | null
          store_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          price: number
          stock: number
          unit?: string
          image_url?: string | null
          store_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          price?: number
          stock?: number
          unit?: string
          image_url?: string | null
          store_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          phone: string | null
          postal_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          store_id: string | null
          territory: string | null
          region: string | null
          type_compte: string | null
          type_marchand: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          territory?: string | null
          region?: string | null
          type_compte?: string | null
          type_marchand?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          territory?: string | null
          region?: string | null
          type_compte?: string | null
          type_marchand?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          postal_code: string | null
          phone: string | null
          email: string | null
          latitude: number | null
          longitude: number | null
          minimum_order: number
          delivery_fee: number
          operating_hours: Json | null
          is_active: boolean
          store_type: string
          manager_id: string | null
          description: string | null
          logo_url: string | null
          banner_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          minimum_order?: number
          delivery_fee?: number
          operating_hours?: Json | null
          is_active?: boolean
          store_type?: string
          manager_id: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          city?: string
          postal_code?: string | null
          phone?: string | null
          email?: string | null
          latitude?: number | null
          longitude?: number | null
          minimum_order?: number
          delivery_fee?: number
          operating_hours?: Json | null
          is_active?: boolean
          store_type?: string
          manager_id?: string | null
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          password: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password?: string
          role?: string
        }
        Relationships: []
      }
      delivery_commissions: {
        Row: {
          id: string
          order_id: string
          driver_id: string | null
          delivery_fee: number
          commission_percent: number
          platform_amount: number
          driver_amount: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          driver_id?: string | null
          delivery_fee: number
          commission_percent: number
          platform_amount: number
          driver_amount: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          driver_id?: string | null
          delivery_fee?: number
          commission_percent?: number
          platform_amount?: number
          driver_amount?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_commissions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          category: string
          is_public: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          category?: string
          is_public?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          category?: string
          is_public?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_connect_accounts: {
        Row: {
          id: string
          account_id: string
          store_id: string
          is_active: boolean
          charges_enabled: boolean
          payouts_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          store_id: string
          is_active?: boolean
          charges_enabled?: boolean
          payouts_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          store_id?: string
          is_active?: boolean
          charges_enabled?: boolean
          payouts_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connect_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          order_id: string
          payment_intent_id: string
          amount: number
          currency: string
          status: string
          customer_email: string
          store_id: string
          platform_commission: number
          merchant_amount: number
          delivery_fee: number
          stripe_fee: number
          net_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          payment_intent_id: string
          amount: number
          currency?: string
          status: string
          customer_email: string
          store_id: string
          platform_commission?: number
          merchant_amount?: number
          delivery_fee?: number
          stripe_fee?: number
          net_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          payment_intent_id?: string
          amount?: number
          currency?: string
          status?: string
          customer_email?: string
          store_id?: string
          platform_commission?: number
          merchant_amount?: number
          delivery_fee?: number
          stripe_fee?: number
          net_amount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_commissions: {
        Row: {
          id: string
          transaction_id: string
          order_id: string
          store_id: string
          commission_type: string
          commission_amount: number
          commission_percentage: number
          platform_amount: number
          merchant_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          order_id: string
          store_id: string
          commission_type?: string
          commission_amount: number
          commission_percentage: number
          platform_amount: number
          merchant_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          order_id?: string
          store_id?: string
          commission_type?: string
          commission_amount?: number
          commission_percentage?: number
          platform_amount?: number
          merchant_amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_commissions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          }
        ]
      }
      promotions: {
        Row: {
          id: string
          merchant_id: string
          store_id: string | null
          title: string
          description: string | null
          discount_percent: number
          start_at: string
          end_at: string
          is_active: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          store_id?: string | null
          title: string
          description?: string | null
          discount_percent: number
          start_at: string
          end_at: string
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          store_id?: string | null
          title?: string
          description?: string | null
          discount_percent?: number
          start_at?: string
          end_at?: string
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      merchant_employees: {
        Row: {
          id: string
          merchant_id: string
          store_id: string | null
          first_name: string
          last_name: string
          phone: string | null
          email: string | null
          employee_code: string
          password_hash: string
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          store_id?: string | null
          first_name: string
          last_name: string
          phone?: string | null
          email?: string | null
          employee_code: string
          password_hash: string
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          store_id?: string | null
          first_name?: string
          last_name?: string
          phone?: string | null
          email?: string | null
          employee_code?: string
          password_hash?: string
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_employees_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      merchant_payment_methods: {
        Row: {
          id: string
          merchant_id: string
          store_id: string | null
          type: string
          provider_account_id: string | null
          credentials: Json | null
          is_enabled: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          store_id?: string | null
          type: string
          provider_account_id?: string | null
          credentials?: Json | null
          is_enabled?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          store_id?: string | null
          type?: string
          provider_account_id?: string | null
          credentials?: Json | null
          is_enabled?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_payment_methods_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      audit_log: {
        Row: {
          id: string
          merchant_id: string | null
          employee_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          merchant_id?: string | null
          employee_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string | null
          employee_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_log_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "merchant_employees"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_assignments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      generate_employee_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_audit_action: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      delivery_status:
        | "assigned"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "failed"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready_for_pickup"
        | "in_delivery"
        | "delivered"
        | "cancelled"
      user_role: "admin" | "client" | "livreur" | "store_manager"
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
      delivery_status: [
        "assigned",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready_for_pickup",
        "in_delivery",
        "delivered",
        "cancelled",
      ],
      user_role: ["admin", "client", "livreur", "store_manager"],
    },
  },
} as const
