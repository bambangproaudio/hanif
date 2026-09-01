export interface EQBand {
  id: string;
  name: string;
  frequency: number;
  gain: number; // dB (-18 to +18)
  q: number; // 0.1 to 10
  type: BiquadFilterType;
}

export interface VocalEQSettings {
  sub: number;    // 60 Hz (-18 to +18)
  bass: number;   // 250 Hz (-18 to +18)
  mid: number;    // 1500 Hz (-18 to +18)
  high: number;   // 4000 Hz (-18 to +18)
  treble: number; // 10000 Hz (-18 to +18)
  lowCut: boolean; // 80 Hz HPF
}

export interface MusicEQSettings {
  sub: number;    // 60 Hz
  bass: number;   // 250 Hz
  mid: number;    // 1500 Hz
  treble: number; // 10000 Hz
  vocalCut: boolean; // Cut center vocal band
}

export type ReverbType = 'hall' | 'plate' | 'room' | 'cathedral' | 'stadium';

export interface FXSettings {
  reverbType: ReverbType;
  reverbDecay: number; // 0.1s to 8s
  reverbPreDelay: number; // 0 to 100ms
  reverbDamp: number; // 1000Hz to 18000Hz
  reverbMix: number; // 0 to 1
  delayTime: number; // 0.05s to 1.0s
  delayFeedback: number; // 0 to 0.9
  delayTone: number; // damping filter
  delayPingPong: boolean;
  delayMix: number; // 0 to 1
}

export type VoiceFXPreset = 'normal' | 'robot' | 'helium' | 'deep' | 'radio' | 'warm';

export interface DynamicsSettings {
  gateEnabled: boolean;
  gateThreshold: number; // -80dB to -20dB
  compEnabled: boolean;
  compThreshold: number; // -40dB to 0dB
  compRatio: number; // 1 to 12
  compAttack: number; // 0.001 to 0.1
  compRelease: number; // 0.05 to 0.5
  compGain: number; // 0 to +12dB
}

export interface ChannelState {
  volume: number; // 0 to 1.2
  mute: boolean;
  solo: boolean;
  pan: number; // -1 (Left) to +1 (Right)
  reverbSend: number; // 0 to 1
  delaySend: number; // 0 to 1
  preampGain: number; // 0 to 2 (0 to +6dB)
}

export interface MixerPreset {
  id: string;
  name: string;
  description: string;
  category: 'karaoke' | 'broadcast' | 'live' | 'dj' | 'custom';
  vocalEQ: VocalEQSettings;
  musicEQ: MusicEQSettings;
  fx: FXSettings;
  dynamics: DynamicsSettings;
  voiceFX: VoiceFXPreset;
  micVolume: number;
  musicVolume: number;
  fxVolume: number;
  masterVolume: number;
}

export interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

export type VisualizerMode = 'spectrum' | 'eq-curve' | 'oscilloscope' | 'circular' | 'waterfall';

export interface YouTubeSearchResult {
  id: string;
  title: string;
  channel: string;
  duration?: string;
  thumbnail: string;
  views?: string;
  isKaraoke?: boolean;
}

export interface KaraokeQueueItem {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
}

