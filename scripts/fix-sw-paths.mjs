// Workaround del bug de @serwist/next en Windows: al globear `public/**` para el
// precache usa el separador del SO, y `path.posix.join` no lo normaliza, así que
// las URLs quedan como "/icons\\icon-192.png". Un precache con esas claves falla
// la instalación del service worker.
//
// En Linux (Vercel) el build ya sale bien y este script es un no-op. Solo hace
// falta para `npm run build` local en Windows. Corre como `postbuild`.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SW = "public/sw.js";
if (!existsSync(SW)) process.exit(0);

const original = readFileSync(SW, "utf8");
// Reemplaza `\\` por `/` solo dentro de literales de string (entre comillas),
// que es donde viven las URLs del manifest de precache.
const fixed = original.replace(
  /(["'])((?:[^"'\\]|\\.)*?)\1/g,
  (match, quote, body) => {
    if (!body.includes("\\\\")) return match;
    return quote + body.replace(/\\\\/g, "/") + quote;
  },
);

if (fixed !== original) {
  writeFileSync(SW, fixed);
  console.log("[fix-sw-paths] normalizadas URLs con backslash en", SW);
}
