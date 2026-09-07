export type ProviderId = "gemini" | "openai" | "anthropic" | "openrouter";

export interface Provider {
  id: ProviderId;
  /** Nombre corto para logs y mensajes de error. */
  label: string;
  /** `true` si su API key está en el entorno del servidor. */
  configured(): boolean;
  /**
   * Manda `system` + `texto` (string) al modelo y devuelve su respuesta cruda.
   * `texto` es SIEMPRE la transcripción ya anonimizada — nunca otra cosa.
   */
  complete(system: string, texto: string): Promise<string>;
}
