"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchIcon } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FUENTE_LABEL,
  type Resultado,
  hrefFuente,
  snippet,
} from "@/lib/busqueda";
import { useEmbedder } from "@/lib/embeddings/use-embedder";

import { buscar, getContenidoIndexable, reindexar } from "./actions";

export function BusquedaView({ indexados }: { indexados: number }) {
  const { phase, modelProgress, error: modelError, embed, embedOne } =
    useEmbedder();

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [count, setCount] = useState(indexados);
  const [indexing, setIndexing] = useState(false);
  const [indexMsg, setIndexMsg] = useState<string | null>(null);

  const busy = phase === "loading-model" || phase === "embedding";

  async function actualizarIndice() {
    setIndexMsg(null);
    setIndexing(true);
    try {
      const docs = await getContenidoIndexable();
      if (docs.length === 0) {
        setCount(0);
        await reindexar([]);
        setIndexMsg("No hay contenido para indexar todavía.");
        return;
      }
      const vectors = await embed(docs.map((d) => d.contenido));
      const conEmbedding = docs
        .map((d, i) => ({ ...d, embedding: vectors[i] ?? [] }))
        .filter((d) => d.embedding.length === 384);
      const res = await reindexar(conEmbedding);
      if (res.error) {
        setIndexMsg(res.error);
      } else {
        setCount(res.count ?? 0);
        setIndexMsg(`Índice actualizado: ${res.count} fragmentos.`);
      }
    } catch {
      setIndexMsg("No se pudo actualizar el índice. Probá de nuevo.");
    } finally {
      setIndexing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchError(null);
    setBuscando(true);
    try {
      const emb = await embedOne(q);
      const res = await buscar(emb);
      if (res.error) setSearchError(res.error);
      setResultados(res.resultados ?? []);
    } catch {
      setSearchError("No se pudo completar la búsqueda.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold tracking-tight">Búsqueda</h1>
      <p className="mt-1 text-sm text-muted">
        Buscá en lenguaje natural sobre tus resúmenes de entrevistas, bitácora y
        evidencia. Los embeddings se calculan en tu dispositivo.
      </p>

      {/* Índice */}
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {count > 0
              ? `${count} fragmentos indexados`
              : "Índice vacío"}
          </p>
          <p className="text-xs text-muted">
            Actualizá el índice después de cargar o editar contenido.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          loading={indexing || (busy && indexing)}
          onClick={actualizarIndice}
        >
          Actualizar índice
        </Button>
      </div>

      {indexMsg && (
        <p className="mt-2 text-xs text-muted" role="status">
          {indexMsg}
        </p>
      )}

      {busy && (
        <div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm">
          {phase === "loading-model" ? (
            <>
              <p className="font-medium">
                Descargando el modelo de búsqueda
                {modelProgress != null ? ` · ${modelProgress}%` : "…"}
              </p>
              <p className="mt-1 text-xs text-muted">
                Solo la primera vez (~35 MB). Después queda en el navegador.
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 font-medium">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              Procesando…
            </p>
          )}
        </div>
      )}

      {modelError && phase === "error" && (
        <Alert tone="danger" className="mt-3">
          {modelError}
        </Alert>
      )}

      {/* Buscador */}
      <form onSubmit={onSubmit} className="mt-5 flex gap-2">
        <div className="relative flex flex-1 items-center">
          <SearchIcon className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: problemas con el sistema de liquidación"
            aria-label="Buscar"
            className="min-h-11 w-full rounded-[0.625rem] border border-line-strong bg-surface pl-[38px] pr-3 text-sm text-ink placeholder:text-muted focus:border-focus focus:outline-none focus:ring-3 focus:ring-focus/50"
          />
        </div>
        <Button type="submit" size="sm" loading={buscando} disabled={!query.trim()}>
          Buscar
        </Button>
      </form>

      {searchError && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {searchError}
        </p>
      )}

      {/* Resultados */}
      <div className="mt-4 space-y-3" aria-live="polite">
        {resultados !== null && resultados.length === 0 && !searchError && (
          <EmptyState
            icon={<SearchIcon />}
            title="Sin resultados"
            description={
              count === 0
                ? "Actualizá el índice primero."
                : "Probá con otras palabras."
            }
          />
        )}
        {resultados?.map((r) => (
          <Link
            key={r.id}
            href={hrefFuente(r.fuente, r.fuente_id)}
            className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                {FUENTE_LABEL[r.fuente]}
              </span>
              <span className="text-[11px] text-muted">
                {Math.round(r.similitud * 100)}% relevante
              </span>
            </div>
            <p className="mt-1.5 text-sm font-semibold">{r.titulo}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {snippet(r.contenido)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
