// Genera los íconos de la PWA + favicon a partir del logo del sistema de diseño
// (dirección "Monograma PPS", proyecto Claude Design "PPS App: Sistema de diseño").
//
// Marca: cuadrado slate-900 con la sigla "PPS" y una barra de progreso de base
// (los 130 hs mínimos como metáfora). Tokens: bg #0f172a, marca #f8fafc.
//
//   node scripts/gen-icons.mjs
//
// Nota: el texto SVG lo rasteriza `sharp` con la fuente sans del sistema. En
// Windows sale Arial/Segoe; en Linux, DejaVu. Para un monograma no se nota, pero
// si regenerás en otra máquina puede variar 1px el kerning — los PNG commiteados
// son la fuente de verdad.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ICON_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app");
mkdirSync(ICON_DIR, { recursive: true });

const BG = "#0f172a"; // slate-900
const FG = "#f8fafc"; // slate-50
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ui-sans-serif, system-ui, sans-serif";

/** Contenido de la marca en un viewBox 0 0 96 96 (sigla + barra de progreso). */
function mark(fg = FG, { mono = false } = {}) {
  return `
    <text x="48" y="55" text-anchor="middle" fill="${fg}"
      font-family="${FONT}" font-weight="600" font-size="27" letter-spacing="0.5">PPS</text>
    <rect x="30" y="64" width="36" height="6" rx="3" fill="${fg}" opacity="${mono ? 1 : 0.3}"/>
    <rect x="30" y="64" width="24" height="6" rx="3" fill="${fg}"/>`;
}

/** Ícono "any": cuadrado redondeado a sangre. */
function svgAny(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="${size}" height="${size}">
    <rect width="96" height="96" rx="24" fill="${BG}"/>${mark()}
  </svg>`;
}

/** Ícono maskable: fondo a sangre total + marca dentro de la zona segura (~70%). */
function svgMaskable(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="${size}" height="${size}">
    <rect width="96" height="96" fill="${BG}"/>
    <g transform="translate(48 48) scale(0.7) translate(-48 -51.5)">${mark()}</g>
  </svg>`;
}

/** Favicon chico: una sola letra (a 16-32px "PPS" es ilegible). */
function svgFavicon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="${size}" height="${size}">
    <rect width="96" height="96" rx="24" fill="${BG}"/>
    <text x="48" y="65" text-anchor="middle" fill="${FG}"
      font-family="${FONT}" font-weight="700" font-size="46">P</text>
  </svg>`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** Envuelve un PNG en un contenedor .ico de un solo tamaño (PNG-in-ICO). */
function pngToIco(pngBuf, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // tipo: ícono
  header.writeUInt16LE(1, 4); // cantidad de imágenes
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size % 256, 0);
  entry.writeUInt8(size % 256, 1);
  entry.writeUInt8(0, 2); // paleta
  entry.writeUInt8(0, 3); // reservado
  entry.writeUInt16LE(1, 4); // planos
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuf.length, 8);
  entry.writeUInt32LE(22, 12); // offset
  return Buffer.concat([header, entry, pngBuf]);
}

const svgAnyMaster = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="24" fill="${BG}"/>${mark()}
</svg>`;

for (const [name, svg, size] of [
  ["icon-192.png", svgAny(192), 192],
  ["icon-512.png", svgAny(512), 512],
  ["icon-maskable-192.png", svgMaskable(192), 192],
  ["icon-maskable-512.png", svgMaskable(512), 512],
  ["apple-touch-icon.png", svgMaskable(180), 180],
]) {
  writeFileSync(join(ICON_DIR, name), await png(svg, size));
  console.log("wrote public/icons/" + name);
}

// SVG vectorial para el favicon moderno y el manifest.
writeFileSync(join(ICON_DIR, "icon.svg"), svgAnyMaster.trim() + "\n");
writeFileSync(join(APP_DIR, "icon.svg"), svgAnyMaster.trim() + "\n");
console.log("wrote public/icons/icon.svg + src/app/icon.svg");

// favicon.ico (32px, una letra) para navegadores viejos.
writeFileSync(
  join(APP_DIR, "favicon.ico"),
  pngToIco(await png(svgFavicon(32), 32), 32),
);
console.log("wrote src/app/favicon.ico");
