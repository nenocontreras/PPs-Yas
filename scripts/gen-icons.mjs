// Genera los íconos PLACEHOLDER de la PWA (sin dependencias: zlib + CRC manual).
// Marca simple: fondo slate-900 con un monograma claro y padding de zona segura
// para las variantes maskable.
//
// Reemplazar por íconos de diseño real en la Fase 8. Correr con:
//   node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ICON_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(ICON_DIR, { recursive: true });

const BG = [15, 23, 42, 255]; // #0f172a slate-900
const FG = [226, 232, 240, 255]; // #e2e8f0 slate-200

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function png(size, { maskable }) {
  const px = (x, y) => {
    // Zona segura: ~20% de padding para maskable (Android recorta a un círculo
    // inscrito en el 80% central), ~8% para los íconos "any".
    const pad = maskable ? size * 0.2 : size * 0.08;
    const inner = size - pad * 2;
    const gx = (x - pad) / inner;
    const gy = (y - pad) / inner;
    if (gx < 0 || gx > 1 || gy < 0 || gy > 1) return BG;

    const cols = [
      [0.12, 0.3],
      [0.42, 0.6],
      [0.72, 0.9],
    ];
    const inBar = cols.some(([a, b]) => gx >= a && gx <= b && gy >= 0.18 && gy <= 0.82);
    const topBar = gy >= 0.18 && gy <= 0.34 && gx >= 0.12 && gx <= 0.6;
    const midBar = gy >= 0.42 && gy <= 0.56 && gx >= 0.12 && gx <= 0.6;
    return inBar || topBar || midBar ? FG : BG;
  };

  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = px(x + 0.5, y + 0.5);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  ["icon-192.png", 192, { maskable: false }],
  ["icon-512.png", 512, { maskable: false }],
  ["icon-maskable-192.png", 192, { maskable: true }],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["apple-touch-icon.png", 180, { maskable: false }],
];

for (const [name, size, opts] of targets) {
  writeFileSync(join(ICON_DIR, name), png(size, opts));
  console.log("wrote public/icons/" + name);
}
