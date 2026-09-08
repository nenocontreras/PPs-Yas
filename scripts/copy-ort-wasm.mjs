// Copia el runtime WASM de onnxruntime-web a public/ort/ para servirlo desde
// nuestro propio origen (mismo dominio, sin CDN, sin CORS/COEP, sin que el
// Service Worker ni el proxy de sesión lo tengan que interceptar). El worker de
// transcripción apunta ahí con `env.backends.onnx.wasm.wasmPaths`.
//
// Corre en `prebuild` (y `predev`). public/ort/ está en .gitignore.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "node_modules", "onnxruntime-web", "dist");
const DEST = join(process.cwd(), "public", "ort");

// Los archivos que onnxruntime-web 1.22 (transformers.js v3) puede pedir según
// el navegador. El .jsep es el que usa Chrome/Edge/Firefox; el plano, un
// fallback. Cada .wasm tiene su glue .mjs al lado.
const FILES = [
  "ort-wasm-simd-threaded.jsep.wasm",
  "ort-wasm-simd-threaded.jsep.mjs",
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
];

if (!existsSync(SRC)) {
  console.error(`[copy-ort-wasm] no existe ${SRC} — ¿faltó npm install?`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });
for (const f of FILES) {
  const from = join(SRC, f);
  if (!existsSync(from)) {
    console.warn(`[copy-ort-wasm] no está ${f}, se saltea`);
    continue;
  }
  copyFileSync(from, join(DEST, f));
  console.log(`[copy-ort-wasm] public/ort/${f}`);
}
