/**
 * TypeScript types for the database.
 *
 * These mirror the schema in db/schema.sql by hand. For full type-safety you
 * can regenerate them from your live project with the Supabase CLI:
 *
 *   supabase gen types typescript --linked > lib/db/database.types.ts
 *
 * (requires `supabase link` first). The hand-written types below are enough to
 * build and typecheck locally without the CLI.
 */

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
      certification_bodies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country: string | null;
          region: string | null;
          website: string | null;
          email: string | null;
          phone: string | null;
          recognized_by: string[];
          notes: string | null;
          source_url: string;
          raw_payload: Json | null;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string;
          country?: string | null;
          region?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          recognized_by?: string[];
          notes?: string | null;
          source_url: string;
          raw_payload?: Json | null;
          source?: string;
        };
        Update: Partial<Database["public"]["Tables"]["certification_bodies"]["Insert"]>;
      };
      manufacturers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          country: string;
          city: string | null;
          region: string | null;
          website: string | null;
          email: string | null;
          phone: string | null;
          industries: string[];
          products: string[];
          cert_body: string | null;
          cert_body_id: string | null;
          cert_number: string | null;
          cert_status: string;
          cert_valid_until: string | null;
          source: string;
          source_url: string;
          raw_payload: Json | null;
          featured: boolean;
          featured_until: string | null;
          search_vector: unknown; // tsvector — not selectable directly in TS
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          country: string;
          city?: string | null;
          region?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          industries?: string[];
          products?: string[];
          cert_body?: string | null;
          cert_body_id?: string | null;
          cert_number?: string | null;
          cert_status?: string;
          cert_valid_until?: string | null;
          source: string;
          source_url: string;
          raw_payload?: Json | null;
          featured?: boolean;
          featured_until?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["manufacturers"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          company: string | null;
          country: string | null;
          message: string;
          industries: string[];
          target_country: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          company?: string | null;
          country?: string | null;
          message: string;
          industries?: string[];
          target_country?: string | null;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      scrape_runs: {
        Row: {
          id: string;
          source: string;
          status: string;
          rows_fetched: number;
          rows_upserted: number;
          error_message: string | null;
          started_at: string;
          finished_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["scrape_runs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["scrape_runs"]["Insert"]>;
      };
      infrastructure_projects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          agency: string;
          project_type: string | null;
          status: string;
          description: string | null;
          budget: number | null;
          contractor_name: string | null;
          contractor_contact: string | null;
          location: string | null;
          start_date: string | null;
          expected_completion: string | null;
          actual_completion: string | null;
          source: string;
          source_url: string;
          raw_payload: Json | null;
          search_vector: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          agency: string;
          project_type?: string | null;
          status?: string;
          description?: string | null;
          budget?: number | null;
          contractor_name?: string | null;
          contractor_contact?: string | null;
          location?: string | null;
          start_date?: string | null;
          expected_completion?: string | null;
          actual_completion?: string | null;
          source: string;
          source_url: string;
          raw_payload?: Json | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["infrastructure_projects"]["Insert"]
        >;
      };
    };
    Views: {
      directory_stats: {
        Row: {
          manufacturer_count: number;
          country_count: number;
          certifier_count: number;
          active_certifier_count: number;
        };
      };
    };
    Functions: {};
    Enums: {};
  };
}
