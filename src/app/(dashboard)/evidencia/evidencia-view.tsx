"use client";

import { useActionState, useMemo, useState, useTransition } from "react";

import { EvidenceIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";
import {
  ACCEPT_ATTR,
  BUCKET,
  type Evidencia,
  MAX_BYTES,
  TIPOS,
  TIPO_LABEL,
  formatBytes,
  parseEtiquetas,
  previewKind,
  tipoBloqueado,
} from "@/lib/evidencia";
import { formatFecha, todayISO } from "@/lib/dates";
import { type FormState, OK } from "@/lib/form";
import { createClient } from "@/lib/supabase/client";

import { createEvidencia, deleteEvidencia, updateEvidencia } from "./actions";

type Item = Pick<
  Evidencia,
  | "id"
  | "titulo"
  | "tipo"
  | "etiquetas"
  | "fecha_captura"
  | "notas"
  | "mime_type"
  | "size_bytes"
> & { signedUrl: string | null };

function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? `.${m[1].toLowerCase()}` : "";
}

export function EvidenciaView({
  items,
  userId,
}: {
  items: Item[];
  userId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) for (const t of it.etiquetas) set.add(t);
    return [...set].sort();
  }, [items]);

  const visibles = items.filter(
    (it) =>
      (tipoFiltro === "todos" || it.tipo === tipoFiltro) &&
      (tagFiltro === null || it.etiquetas.includes(tagFiltro)),
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Evidencia</h1>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Subir evidencia
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={tipoFiltro === "todos"} onClick={() => setTipoFiltro("todos")}>
          Todos ({items.length})
        </Chip>
        {TIPOS.map((t) => {
          const n = items.filter((it) => it.tipo === t).length;
          if (n === 0) return null;
          return (
            <Chip
              key={t}
              active={tipoFiltro === t}
              onClick={() => setTipoFiltro(t)}
            >
              {TIPO_LABEL[t]} ({n})
            </Chip>
          );
        })}
      </div>

      {allTags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">Etiqueta:</span>
          {allTags.map((t) => (
            <Chip
              key={t}
              small
              active={tagFiltro === t}
              onClick={() => setTagFiltro(tagFiltro === t ? null : t)}
            >
              {t}
            </Chip>
          ))}
        </div>
      )}

      {adding && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-medium">Subir evidencia</p>
          <UploadForm
            userId={userId}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {visibles.length === 0 && !adding && (
          <EmptyState
            icon={<EvidenceIcon />}
            title={
              items.length === 0
                ? "Sin evidencia cargada"
                : "Nada con ese filtro"
            }
            description={
              items.length === 0
                ? "Subí documentos, capturas o notas de tus jornadas."
                : undefined
            }
            action={
              items.length === 0 ? (
                <Button size="sm" onClick={() => setAdding(true)}>
                  Subir evidencia
                </Button>
              ) : undefined
            }
          />
        )}

        {visibles.map((it) =>
          editingId === it.id ? (
            <div
              key={it.id}
              className="rounded-xl border border-line bg-surface p-4"
            >
              <p className="mb-3 text-sm font-medium">Editar evidencia</p>
              <MetaForm
                item={it}
                action={updateEvidencia.bind(null, it.id)}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <EvidenciaCard
              key={it.id}
              item={it}
              onEdit={() => setEditingId(it.id)}
              onTag={(t) => setTagFiltro(t)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  small,
  onClick,
  children,
}: {
  active: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border font-medium transition-colors",
        small ? "min-h-7 px-2.5 text-[11px]" : "min-h-9 px-3 text-xs",
        active
          ? "border-primary bg-primary text-primary-fg"
          : "border-line text-muted hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

function EvidenciaCard({
  item,
  onEdit,
  onTag,
}: {
  item: Item;
  onEdit: () => void;
  onTag: (t: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const kind = previewKind(item.mime_type);

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      {item.signedUrl && kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.signedUrl}
          alt={item.titulo}
          className="max-h-72 w-full bg-surface-2 object-contain"
        />
      )}
      {item.signedUrl && kind === "pdf" && (
        <iframe
          src={item.signedUrl}
          title={item.titulo}
          className="h-72 w-full border-0 bg-surface-2"
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-semibold">{item.titulo}</h2>
          <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
            {TIPO_LABEL[item.tipo]}
          </span>
        </div>

        {item.etiquetas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.etiquetas.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTag(t)}
                className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted hover:text-ink"
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {item.notas && (
          <p className="mt-2 whitespace-pre-wrap text-xs text-muted">
            {item.notas}
          </p>
        )}

        <p className="mt-2 text-[11px] text-muted">
          {item.fecha_captura && (
            <span className="capitalize">
              {formatFecha(item.fecha_captura)}
            </span>
          )}
          {item.fecha_captura && item.size_bytes != null && " · "}
          {formatBytes(item.size_bytes)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {item.signedUrl && (
            <Button asChild variant="ghost" size="sm">
              <a href={item.signedUrl} target="_blank" rel="noreferrer">
                Abrir
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={pending}
            className="text-danger hover:bg-danger-bg"
            onClick={() => {
              if (!window.confirm("¿Borrar esta evidencia y su archivo?")) return;
              setDelError(null);
              startTransition(async () => {
                const res = await deleteEvidencia(item.id);
                if (res.error) setDelError(res.error);
              });
            }}
          >
            Borrar
          </Button>
        </div>
        {delError && (
          <p className="mt-2 text-xs text-danger" role="alert">
            {delError}
          </p>
        )}
      </div>
    </article>
  );
}

/** Formulario de subida: sube el archivo a Storage y después crea la fila. */
function UploadForm({
  userId,
  onDone,
  onCancel,
}: {
  userId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const upload = async (
    _prev: FormState,
    formData: FormData,
  ): Promise<FormState> => {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { fieldErrors: { file: "Elegí un archivo." } };
    }
    if (file.size > MAX_BYTES) {
      return { fieldErrors: { file: "El archivo supera los 10 MB." } };
    }
    if (tipoBloqueado(file.type)) {
      return { fieldErrors: { file: "Ese tipo de archivo no está permitido." } };
    }

    const supabase = createClient();
    const path = `${userId}/${crypto.randomUUID()}${extOf(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      return /mime|type/i.test(upErr.message)
        ? { fieldErrors: { file: "Ese tipo de archivo no está permitido." } }
        : { error: "No se pudo subir el archivo. Reintentá." };
    }

    const result = await createEvidencia({
      titulo: String(formData.get("titulo") ?? ""),
      tipo: String(formData.get("tipo") ?? "otro"),
      etiquetas: parseEtiquetas(String(formData.get("etiquetas") ?? "")),
      fecha_captura: String(formData.get("fecha_captura") ?? "") || null,
      notas: String(formData.get("notas") ?? "").trim() || null,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
    });
    if (result.ok) onDone();
    return result;
  };

  const [state, formAction] = useActionState(upload, OK);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      {state.error && (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ev-file" className="text-[13px] font-medium">
          Archivo
        </label>
        <input
          id="ev-file"
          name="file"
          type="file"
          required
          accept={ACCEPT_ATTR}
          className="text-sm file:mr-3 file:min-h-9 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:text-sm file:font-semibold file:text-primary-fg"
        />
        {fe.file && <p className="text-xs text-danger">{fe.file}</p>}
        <p className="text-xs text-muted">Hasta 10 MB.</p>
      </div>

      <MetaFields defaults={{ fecha_captura: todayISO() }} fieldErrors={fe} />

      <div className="flex gap-2">
        <SubmitButton size="sm">Subir</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

/** Formulario de metadatos (edición; no toca el archivo). */
function MetaForm({
  item,
  action,
  onDone,
  onCancel,
}: {
  item: Item;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const wrapped = async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.ok) onDone();
    return result;
  };
  const [state, formAction] = useActionState(wrapped, OK);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      {state.error && (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      )}
      <MetaFields
        defaults={{
          titulo: item.titulo,
          tipo: item.tipo,
          etiquetas: item.etiquetas.join(", "),
          fecha_captura: item.fecha_captura ?? "",
          notas: item.notas ?? "",
        }}
        fieldErrors={state.fieldErrors ?? {}}
      />
      <div className="flex gap-2">
        <SubmitButton size="sm">Guardar</SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function MetaFields({
  defaults,
  fieldErrors,
}: {
  defaults: {
    titulo?: string;
    tipo?: string;
    etiquetas?: string;
    fecha_captura?: string;
    notas?: string;
  };
  fieldErrors: Record<string, string>;
}) {
  return (
    <>
      <TextField
        label="Título"
        name="titulo"
        required
        defaultValue={defaults.titulo ?? ""}
        error={fieldErrors.titulo}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo" name="tipo" defaultValue={defaults.tipo ?? "otro"}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {TIPO_LABEL[t]}
            </option>
          ))}
        </Select>
        <TextField
          label="Fecha de captura"
          name="fecha_captura"
          type="date"
          optional
          max={todayISO()}
          defaultValue={defaults.fecha_captura ?? ""}
        />
      </div>
      <TextField
        label="Etiquetas"
        name="etiquetas"
        optional
        placeholder="Separadas por comas: rrhh, organigrama"
        defaultValue={defaults.etiquetas ?? ""}
      />
      <Textarea
        label="Notas"
        name="notas"
        optional
        rows={2}
        defaultValue={defaults.notas ?? ""}
      />
    </>
  );
}
