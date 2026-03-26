export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          default_currency: string;
          theme: "light" | "dark" | "system";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          default_currency?: string;
          theme?: "light" | "dark" | "system";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          default_currency?: string;
          theme?: "light" | "dark" | "system";
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string;
          color?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          currency: string;
          description: string;
          date: string;
          notes: string | null;
          is_recurring: boolean;
          recurring_expense_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          currency?: string;
          description: string;
          date: string;
          notes?: string | null;
          is_recurring?: boolean;
          recurring_expense_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          amount?: number;
          currency?: string;
          description?: string;
          date?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency: string;
          month: number;
          year: number;
          alert_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          currency?: string;
          month: number;
          year: number;
          alert_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          currency?: string;
          alert_threshold?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          currency: string;
          description: string;
          frequency: "daily" | "weekly" | "monthly" | "yearly";
          next_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          currency?: string;
          description: string;
          frequency: "daily" | "weekly" | "monthly" | "yearly";
          next_date: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          amount?: number;
          currency?: string;
          description?: string;
          frequency?: "daily" | "weekly" | "monthly" | "yearly";
          next_date?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          id: string;
          base_currency: string;
          target_currency: string;
          rate: number;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          base_currency: string;
          target_currency: string;
          rate: number;
          fetched_at?: string;
        };
        Update: {
          rate?: number;
          fetched_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_budget_summary: {
        Args: {
          p_user_id: string;
          p_month: number;
          p_year: number;
        };
        Returns: {
          budget_id: string;
          category_id: string;
          category_name: string;
          category_icon: string;
          category_color: string;
          budget_amount: number;
          budget_currency: string;
          alert_threshold: number;
          spent: number;
          remaining: number;
          percentage: number;
          status: "ok" | "warning" | "exceeded";
        }[];
      };
      seed_default_categories: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
