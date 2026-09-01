/**
 * Soundboard FX Synthesizer and Audio Buffer player
 */

export function playKetawa(ctx: AudioContext, destination: AudioNode) {
  const now = ctx.currentTime;
  const numGiggles = 7;

  for (let i = 0; i < numGiggles; i++) {
    const startTime = now + i * 0.13;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const baseFreq = 260 + (i % 2 === 0 ? 60 : 0) + Math.random() * 30;
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, startTime + 0.1);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800 + Math.random() * 200, startTime);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.12);
  }
}

export function playApplause(ctx: AudioContext, destination: AudioNode, duration: number = 2.5) {
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Generate clapping bursts
  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin((t / duration) * Math.PI);
    // Add periodic claps density
    const burst = Math.sin(t * 80 + Math.sin(t * 12)) * 0.5 + 0.5;
    left[i] = (Math.random() * 2 - 1) * envelope * (0.4 + 0.6 * burst);
    right[i] = (Math.random() * 2 - 1) * envelope * (0.4 + 0.6 * burst);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1400;
  bandpass.Q.value = 1.2;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 400;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  noise.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(gain);
  gain.connect(destination);

  noise.start();
}

export function playAirHorn(ctx: AudioContext, destination: AudioNode) {
  const now = ctx.currentTime;
  const freqs = [311.13, 370.0, 466.16, 622.25]; // Eb4, F#4, Bb4, Eb5 classic reggaeton/DJ chord
  const beeps = [
    { start: 0, duration: 0.12 },
    { start: 0.16, duration: 0.12 },
    { start: 0.32, duration: 0.12 },
    { start: 0.48, duration: 0.38 }
  ];

  beeps.forEach(beep => {
    const startTime = now + beep.start;
    const endTime = startTime + beep.duration;

    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const distortion = ctx.createWaveShaper();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, startTime);
      // Slight pitch bend up
      osc.frequency.exponentialRampToValueAtTime(f * 1.03, endTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18 / freqs.length, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(startTime);
      osc.stop(endTime);
    });
  });
}

export function playRimshot(ctx: AudioContext, destination: AudioNode) {
  const now = ctx.currentTime;

  // Snare / Rim sound
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(450, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

  oscGain.gain.setValueAtTime(0.6, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(oscGain);
  oscGain.connect(destination);
  osc.start(now);
  osc.stop(now + 0.08);

  // Metal / Stick Click
  const sampleRate = ctx.sampleRate;
  const noiseLen = Math.floor(sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, noiseLen, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3500;
  filter.Q.value = 4;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);

  noise.start(now);
}

export function playLaser(ctx: AudioContext, destination: AudioNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(now);
  osc.stop(now + 0.26);
}

export function playSubDrop(ctx: AudioContext, destination: AudioNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);

  gain.gain.setValueAtTime(0.6, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(now);
  osc.stop(now + 1.35);
}

export function playDJDrop(ctx: AudioContext, destination: AudioNode) {
  // Synthesized DJ stutter riser + robo chord
  const now = ctx.currentTime;
  const tones = [440, 554.37, 659.25, 880];

  tones.forEach((tone, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(tone * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(tone * 1.5, now + 0.6);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.75);
  });
}
