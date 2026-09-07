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
      entrevistas: {
        Row: {
          id: string;
          user_id: string;
          puesto: string;
          area: string | null;
          fecha: string | null;
          duracion_estimada: number | null;
          consentimiento_registrado: boolean;
          transcripcion: string | null;
          resumen: string | null;
          temas_detectados: Json | null;
        } & TimestampCols;
        Insert: {
          id?: string;
          user_id: string;
          puesto: string;
          area?: string | null;
          fecha?: string | null;
          duracion_estimada?: number | null;
          consentimiento_registrado?: boolean;
          transcripcion?: string | null;
          resumen?: string | null;
          temas_detectados?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          puesto?: string;
          area?: string | null;
          fecha?: string | null;
          duracion_estimada?: number | null;
          consentimiento_registrado?: boolean;
          transcripcion?: string | null;
          resumen?: string | null;
          temas_detectados?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      evidencia: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          tipo: Database["public"]["Enums"]["evidencia_tipo"];
          etiquetas: string[];
          fecha_captura: string | null;
          notas: string | null;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
        } & TimestampCols;
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          tipo?: Database["public"]["Enums"]["evidencia_tipo"];
          etiquetas?: string[];
          fecha_captura?: string | null;
          notas?: string | null;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string;
          tipo?: Database["public"]["Enums"]["evidencia_tipo"];
          etiquetas?: string[];
          fecha_captura?: string | null;
          notas?: string | null;
          storage_path?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documentos_indexados: {
        Row: {
          id: string;
          user_id: string;
          fuente: Database["public"]["Enums"]["documento_fuente"];
          fuente_id: string;
          titulo: string;
          contenido: string;
          embedding: string;
        } & TimestampCols;
        Insert: {
          id?: string;
          user_id: string;
          fuente: Database["public"]["Enums"]["documento_fuente"];
          fuente_id: string;
          titulo: string;
          contenido: string;
          embedding: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fuente?: Database["public"]["Enums"]["documento_fuente"];
          fuente_id?: string;
          titulo?: string;
          contenido?: string;
          embedding?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ia_usos: {
        Row: {
          id: string;
          user_id: string;
          proveedor: string;
          entrevista_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          proveedor: string;
          entrevista_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          proveedor?: string;
          entrevista_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      match_documentos: {
        Args: { query_embedding: string; match_count?: number };
        Returns: {
          id: string;
          fuente: Database["public"]["Enums"]["documento_fuente"];
          fuente_id: string;
          titulo: string;
          contenido: string;
          similitud: number;
        }[];
      };
    };
    Enums: {
      tarea_estado: "pendiente" | "en_curso" | "completada";
      evento_tipo: "jornada" | "entrega" | "hito" | "otro";
      evidencia_tipo:
        | "documento"
        | "captura"
        | "nota"
        | "organigrama"
        | "otro";
      documento_fuente: "entrevista" | "jornada" | "evidencia";
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
