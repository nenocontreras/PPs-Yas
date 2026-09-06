/**
 * Decodifica un archivo/Blob de audio a Float32Array mono 16 kHz para Whisper.
 * Todo pasa por `AudioContext` en el navegador — no hay ninguna llamada de red
 * (confidentiality-guard). El audio nunca deja el dispositivo.
 */
const TARGET_RATE = 16000;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor {
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) throw new Error("Este navegador no soporta decodificar audio.");
  return Ctor;
}

export async function decodeToMono16k(file: Blob): Promise<Float32Array> {
  const arrayBuffer = await file.arrayBuffer();
  const Ctor = getAudioContextCtor();

  // Pedir el contexto directamente a 16 kHz hace que decodeAudioData resamplee.
  let ctx: AudioContext;
  try {
    ctx = new Ctor({ sampleRate: TARGET_RATE });
  } catch {
    ctx = new Ctor();
  }

  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    const mono = toMono(decoded);
    return ctx.sampleRate === TARGET_RATE
      ? mono
      : await resample(mono, ctx.sampleRate, TARGET_RATE);
  } finally {
    void ctx.close();
  }
}

function toMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice();
  const out = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) out[i] += data[i] / buffer.numberOfChannels;
  }
  return out;
}

async function resample(
  input: Float32Array,
  fromRate: number,
  toRate: number,
): Promise<Float32Array> {
  const frames = Math.ceil((input.length * toRate) / fromRate);
  const offline = new OfflineAudioContext(1, frames, toRate);
  const buf = offline.createBuffer(1, input.length, fromRate);
  buf.getChannelData(0).set(input);
  const src = offline.createBufferSource();
  src.buffer = buf;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}
