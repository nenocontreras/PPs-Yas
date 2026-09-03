---
name: whisper-transcribe-setup
description: Cómo integrar transcripción de audio 100% client-side con transformers.js (Whisper WASM) en el módulo de entrevistas. Usar al implementar la Parte B del módulo de entrevistas o cualquier feature de grabación/transcripción de audio.
---

# Transcripción client-side con transformers.js (Whisper WASM)

Regla que no se negocia (`confidentiality-guard`): **el audio nunca sale del dispositivo.** Toda esta skill asume que la transcripción corre en el navegador y que ningún `Blob` de audio entra a un `fetch()`.

## Dependencia

```
npm i @huggingface/transformers
```

(`@xenova/transformers` es el paquete viejo; el actual es `@huggingface/transformers` v3+, con backend WASM y WebGPU.)

## Arquitectura

1. **Web Worker** (`src/lib/transcription/worker.ts`): carga el modelo y corre la inferencia fuera del hilo principal. Nunca bloquear la UI del celular.
2. **Modelo**: `onnx-community/whisper-base` (o `whisper-small` si el dispositivo aguanta). `base` es el mejor equilibrio para un celular gama media. Español: pasar `language: "spanish"` y `task: "transcribe"`.
3. **Progreso**: el callback `progress_callback` del `pipeline` reporta la descarga del modeloz (se cachea en el navegador con Cache API tras la primera vez). Mostrar barra de "descargando modelo" y luego "transcribiendo".
4. **Entrada de audio**: `MediaRecorder` para grabar, o `<input type="file" accept="audio/*">` para subir. Decodificar a `Float32Array` mono 16 kHz con `AudioContext` antes de pasar al pipeline.
5. **Salida**: el texto va a un `<textarea>` editable. El usuario corrige y **anonimiza nombres** antes de guardar. Recién ahí se persiste (`transcripcion` en la tabla `entrevistas`).

## Esqueleto del worker

```ts
// src/lib/transcription/worker.ts
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

let transcriber: any = null;

self.onmessage = async (e: MessageEvent) => {
  const { audio } = e.data; // Float32Array mono 16kHz

  if (!transcriber) {
    transcriber = await pipeline(
      "automatic-speech-recognition",
      "onnx-community/whisper-base",
      {
        progress_callback: (p: any) =>
          self.postMessage({ type: "progress", payload: p }),
      },
    );
  }

  const output = await transcriber(audio, {
    language: "spanish",
    task: "transcribe",
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false,
  });

  self.postMessage({ type: "done", payload: output.text });
};
```

## Config de Next.js

- El worker se instancia con `new Worker(new URL("...", import.meta.url))`.
- Servir cabeceras COOP/COEP si se usa `SharedArrayBuffer` (threads WASM):
  `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` en `next.config`. Si rompe otras cosas, usar el backend WASM sin threads.
- El modelo se descarga de HuggingFace CDN al **navegador** del usuario (no a un backend nuestro). Eso está permitido: es cliente ↔ CDN de modelos, no sube datos del usuario.

## Checklist de confidencialidad (obligatorio antes de dar por hecho el módulo)

- [ ] No hay ningún `fetch` / Server Action que reciba el audio.
- [ ] El `Blob`/`File`/`Float32Array` de audio solo viaja main thread ↔ worker.
- [ ] Si se guarda audio para reproducir después → solo IndexedDB local, nunca Storage/servidor, y solo si el usuario lo pidió explícitamente.
- [ ] La tabla `entrevistas` no tiene columna de audio.
- [ ] Grep del módulo: `grep -rn "audio" src/app/(dashboard)/entrevistas` no muestra rutas de red.
