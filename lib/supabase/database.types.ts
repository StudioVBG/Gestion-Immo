/**
 * Types TypeScript générés automatiquement depuis Supabase
 * 
 * ⚠️ NE PAS MODIFIER MANUELLEMENT
 * Ce fichier est généré via MCP Supabase : mcp_supabase_generate_typescript_types
 * 
 * Pour régénérer : Utiliser l'outil MCP Supabase dans Cursor
 * 
 * Date de génération : 2025-02-15
 */

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          owner_id: string
          type: string
          adresse_complete: string
          code_postal: string
          ville: string
          departement: string
          surface: number
          nb_pieces: number
          etage: number | null
          ascenseur: boolean
          energie: string | null
          ges: string | null
          unique_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          type: string
          adresse_complete: string
          code_postal: string
          ville: string
          departement: string
          surface: number
          nb_pieces: number
          etage?: number | null
          ascenseur?: boolean
          energie?: string | null
          ges?: string | null
          unique_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          type?: string
          adresse_complete?: string
          code_postal?: string
          ville?: string
          departement?: string
          surface?: number
          nb_pieces?: number
          etage?: number | null
          ascenseur?: boolean
          energie?: string | null
          ges?: string | null
          unique_code?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          role: string
          prenom: string | null
          nom: string | null
          telephone: string | null
          avatar_url: string | null
          date_naissance: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          prenom?: string | null
          nom?: string | null
          telephone?: string | null
          avatar_url?: string | null
          date_naissance?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          prenom?: string | null
          nom?: string | null
          telephone?: string | null
          avatar_url?: string | null
          date_naissance?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      leases: {
        Row: {
          id: string
          property_id: string | null
          unit_id: string | null
          type_bail: string
          loyer: number
          charges_forfaitaires: number
          depot_de_garantie: number
          date_debut: string
          date_fin: string | null
          statut: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id?: string | null
          unit_id?: string | null
          type_bail: string
          loyer: number
          charges_forfaitaires?: number
          depot_de_garantie?: number
          date_debut: string
          date_fin?: string | null
          statut?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string | null
          unit_id?: string | null
          type_bail?: string
          loyer?: number
          charges_forfaitaires?: number
          depot_de_garantie?: number
          date_debut?: string
          date_fin?: string | null
          statut?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          id: string
          lease_id: string
          owner_id: string
          tenant_id: string
          periode: string
          montant_total: number
          montant_loyer: number
          montant_charges: number
          statut: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lease_id: string
          owner_id: string
          tenant_id: string
          periode: string
          montant_total: number
          montant_loyer: number
          montant_charges?: number
          statut?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lease_id?: string
          owner_id?: string
          tenant_id?: string
          periode?: string
          montant_total?: number
          montant_loyer?: number
          montant_charges?: number
          statut?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          id: string
          property_id: string
          lease_id: string | null
          created_by_profile_id: string
          titre: string
          description: string
          priorite: string
          statut: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          lease_id?: string | null
          created_by_profile_id: string
          titre: string
          description: string
          priorite?: string
          statut?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          lease_id?: string | null
          created_by_profile_id?: string
          titre?: string
          description?: string
          priorite?: string
          statut?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      // ... autres tables (voir fichier complet généré par MCP)
    }
    Views: {
      v_person_age: {
        Row: {
          person_id: string | null
          user_id: string | null
          birthdate: string | null
          age_years: number | null
          age_bucket: string | null
        }
      }
    }
    Functions: {
      user_profile_id: { Args: never; Returns: string }
      user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      generate_unique_code: { Args: never; Returns: string }
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

