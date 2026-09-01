import { ReverbType } from '../types';

/**
 * Synthesizes a stereo acoustic impulse response for Web Audio ConvolverNode
 */
export function generateImpulseResponse(
  ctx: AudioContext,
  duration: number,
  type: ReverbType = 'hall',
  damping: number = 8000
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  // Parameter adjustments per room acoustic archetype
  let decayExponent = 3.0;
  let diffusion = 0.8;
  let preDelaySamples = 0;

  switch (type) {
    case 'plate':
      decayExponent = 2.4;
      diffusion = 0.95;
      preDelaySamples = Math.floor(sampleRate * 0.008);
      break;
    case 'room':
      decayExponent = 4.5;
      diffusion = 0.6;
      preDelaySamples = Math.floor(sampleRate * 0.015);
      break;
    case 'cathedral':
      decayExponent = 1.8;
      diffusion = 0.9;
      preDelaySamples = Math.floor(sampleRate * 0.035);
      break;
    case 'stadium':
      decayExponent = 1.4;
      diffusion = 0.75;
      preDelaySamples = Math.floor(sampleRate * 0.06);
      break;
    case 'hall':
    default:
      decayExponent = 2.8;
      diffusion = 0.85;
      preDelaySamples = Math.floor(sampleRate * 0.02);
      break;
  }

  // Generate diffuse noise with exponential decay & stereo decorrelation
  for (let i = 0; i < length; i++) {
    if (i < preDelaySamples) {
      left[i] = 0;
      right[i] = 0;
      continue;
    }

    const t = (i - preDelaySamples) / sampleRate;
    const decay = Math.exp(-t * decayExponent);

    // Filter simulation: high frequencies decay faster
    const filterFactor = Math.pow(1 - (i / length), damping / 10000);

    const noiseL = (Math.random() * 2 - 1) * decay * filterFactor;
    const noiseR = (Math.random() * 2 - 1) * decay * filterFactor;

    // Cross-channel diffusion
    left[i] = noiseL * diffusion + noiseR * (1 - diffusion);
    right[i] = noiseR * diffusion + noiseL * (1 - diffusion);

    // Initial early reflections simulation
    if (i < sampleRate * 0.08) {
      if (i % 380 === 0) left[i] += 0.4 * decay;
      if (i % 490 === 0) right[i] += 0.4 * decay;
    }
  }

  return impulse;
}
