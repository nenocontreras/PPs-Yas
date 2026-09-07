import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Service worker compilado por Serwist en el build.
    "public/sw.js",
    "public/sw.js.map",
    "public/swe-worker-*.js",
    // Runtime WASM de onnxruntime-web, copiado desde node_modules en prebuild.
    "public/ort/**",
    // Design system: previews y runtime de Claude Design, no es código de la app.
    "design-system/**",
  ]),
]);

export default eslintConfig;
