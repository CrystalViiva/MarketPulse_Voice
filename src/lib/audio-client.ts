// Browser decoding keeps uploads private until consented submission. Normalize
// to the documented local-model input format; server independently checks it.
export async function toWav(blob: Blob): Promise<Blob> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration > 30 || decoded.duration < 0.1)
      throw new Error('Choose audio shorter than 30 seconds.');
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const normalized = await offline.startRendering();
    const samples = normalized.getChannelData(0);
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const text = (o: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    text(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    text(8, 'WAVE');
    text(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 16000, true);
    view.setUint32(28, 32000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((sample, i) =>
      view.setInt16(
        44 + i * 2,
        Math.max(-1, Math.min(1, sample)) * (sample < 0 ? 32768 : 32767),
        true,
      ),
    );
    return new Blob([buffer], { type: 'audio/wav' });
  } finally {
    await context.close();
  }
}
