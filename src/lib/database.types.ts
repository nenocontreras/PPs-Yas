/**
 * Tipos del esquema de Postgres. Escrito a mano a partir de
 * `supabase/migrations/`. Regenerar tras cada migración con:
 *
 *   npx supabase gen types typescript --project-id <TU_PROJECT_ID> > src/lib/database.types.ts
 *
 * (o `--local` si usás el stack local de Supabase CLI).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TimestampCols = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      jornadas: {
        Row: {
          id: string;
          user_id: string;
          fecha: string;
          horas: number;
          tareas_realizadas: string;
          observaciones: string | null;
        } & TimestampCols;
        Insert: {
          id?: string;
          user_id: string;
          fecha: string;
          horas: number;
          tareas_realizadas: string;
          observaciones?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fecha?: string;
          horas?: number;
          tareas_realizadas?: string;
          observaciones?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tareas: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          descripcion: string | null;
          estado: Database["public"]["Enums"]["tarea_estado"];
          bloque: string | null;
        } & TimestampCols;
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["tarea_estado"];
          bloque?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string;
          descripcion?: string | null;
          estado?: Database["public"]["Enums"]["tarea_estado"];
          bloque?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      eventos: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          fecha: string;
          tipo: Database["public"]["Enums"]["evento_tipo"];
        } & TimestampCols;
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          fecha: string;
          tipo?: Database["public"]["Enums"]["evento_tipo"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string;
          fecha?: string;
          tipo?: Database["public"]["Enums"]["evento_tipo"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      tarea_estado: "pendiente" | "en_curso" | "completada";
      evento_tipo: "jornada" | "entrega" | "hito" | "otro";
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
