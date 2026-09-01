import {
  VocalEQSettings,
  MusicEQSettings,
  FXSettings,
  DynamicsSettings,
  VoiceFXPreset,
  ReverbType
} from '../types';
import { generateImpulseResponse } from './impulseResponses';
import {
  playKetawa,
  playApplause,
  playAirHorn,
  playRimshot,
  playLaser,
  playSubDrop,
  playDJDrop
} from './soundboardAudio';

export class AudioEngine {
  private static instance: AudioEngine;
  public ctx: AudioContext | null = null;
  public isRunning: boolean = false;
  public micConnected: boolean = false;

  // Master Nodes
  public masterGain: GainNode | null = null;
  public masterLimiter: DynamicsCompressorNode | null = null;
  public masterAnalyser: AnalyserNode | null = null;
  public masterAnalyserL: AnalyserNode | null = null;
  public masterAnalyserR: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private mediaDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording: boolean = false;
  public recordingDuration: number = 0;
  private recordTimer: number | null = null;

  // Mic Chain
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  public micPreamp: GainNode | null = null;
  public micHPF: BiquadFilterNode | null = null;
  public micGate: GainNode | null = null;
  public micEQ = {
    sub: null as BiquadFilterNode | null,
    bass: null as BiquadFilterNode | null,
    mid: null as BiquadFilterNode | null,
    high: null as BiquadFilterNode | null,
    treble: null as BiquadFilterNode | null,
  };
  public micCompressor: DynamicsCompressorNode | null = null;
  public micPan: StereoPannerNode | null = null;
  public micChannelGain: GainNode | null = null;
  public micReverbSend: GainNode | null = null;
  public micDelaySend: GainNode | null = null;
  public micAnalyser: AnalyserNode | null = null;

  // Voice FX Filter Chain
  private voiceFXFilter1: BiquadFilterNode | null = null;
  private voiceFXFilter2: BiquadFilterNode | null = null;

  // Music / Backing Track Chain
  public musicGain: GainNode | null = null;
  public musicEQ = {
    sub: null as BiquadFilterNode | null,
    bass: null as BiquadFilterNode | null,
    mid: null as BiquadFilterNode | null,
    treble: null as BiquadFilterNode | null,
  };
  public vocalCutFilter: BiquadFilterNode | null = null;
  public musicPan: StereoPannerNode | null = null;
  public musicReverbSend: GainNode | null = null;
  public musicDelaySend: GainNode | null = null;
  public musicAnalyser: AnalyserNode | null = null;
  public audioElement: HTMLAudioElement | null = null;
  public audioSourceNode: MediaElementAudioSourceNode | null = null;

  // FX Bus Nodes
  public fxGain: GainNode | null = null;
  public reverbConvolver: ConvolverNode | null = null;
  public reverbPreDelay: DelayNode | null = null;
  public reverbDampFilter: BiquadFilterNode | null = null;
  public reverbWetGain: GainNode | null = null;
  public delayNode: DelayNode | null = null;
  public delayFeedbackGain: GainNode | null = null;
  public delayDampFilter: BiquadFilterNode | null = null;
  public delayWetGain: GainNode | null = null;
  public fxAnalyser: AnalyserNode | null = null;

  // Soundboard Bus
  public soundboardGain: GainNode | null = null;
  public soundboardAnalyser: AnalyserNode | null = null;

  // State caches
  public micMuted: boolean = false;
  public musicMuted: boolean = false;
  public fxMuted: boolean = false;
  public micSolo: boolean = false;
  public musicSolo: boolean = false;
  public vocalCutActive: boolean = false;
  public activeVoiceFX: VoiceFXPreset = 'normal';
  public currentDeviceId: string = '';

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initAudio(deviceId?: string): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.setupMasterChain();
      this.setupFXBus();
      this.setupMusicChain();
      this.setupSoundboardBus();
      await this.setupMicChain(deviceId);

      this.isRunning = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize Web Audio Engine:', err);
      return false;
    }
  }

  private setupMasterChain() {
    if (!this.ctx) return;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    // Master Limiter / Output Stage
    this.masterLimiter = this.ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.value = -0.5;
    this.masterLimiter.knee.value = 0;
    this.masterLimiter.ratio.value = 20;
    this.masterLimiter.attack.value = 0.002;
    this.masterLimiter.release.value = 0.05;

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 512;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    this.masterAnalyserL = this.ctx.createAnalyser();
    this.masterAnalyserL.fftSize = 256;
    this.masterAnalyserR = this.ctx.createAnalyser();
    this.masterAnalyserR.fftSize = 256;

    this.splitter = this.ctx.createChannelSplitter(2);

    this.mediaDest = this.ctx.createMediaStreamDestination();

    // Wiring: MasterGain -> Limiter -> MasterAnalyser -> Destination & Splitter & MediaDest
    this.masterGain.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
    this.masterAnalyser.connect(this.mediaDest);

    this.masterAnalyser.connect(this.splitter);
    this.splitter.connect(this.masterAnalyserL, 0);
    this.splitter.connect(this.masterAnalyserR, 1);
  }

  private setupFXBus() {
    if (!this.ctx || !this.masterGain) return;

    this.fxGain = this.ctx.createGain();
    this.fxGain.gain.value = 0.7;

    this.fxAnalyser = this.ctx.createAnalyser();
    this.fxAnalyser.fftSize = 256;

    // Reverb Chain
    this.reverbPreDelay = this.ctx.createDelay(1.0);
    this.reverbPreDelay.delayTime.value = 0.02;

    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = generateImpulseResponse(this.ctx, 2.2, 'hall');

    this.reverbDampFilter = this.ctx.createBiquadFilter();
    this.reverbDampFilter.type = 'lowpass';
    this.reverbDampFilter.frequency.value = 8000;

    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = 0.45;

    this.reverbPreDelay.connect(this.reverbDampFilter);
    this.reverbDampFilter.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWetGain);
    this.reverbWetGain.connect(this.fxGain);

    // Delay / Echo Chain
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.28;

    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = 0.38;

    this.delayDampFilter = this.ctx.createBiquadFilter();
    this.delayDampFilter.type = 'lowpass';
    this.delayDampFilter.frequency.value = 5000;

    this.delayWetGain = this.ctx.createGain();
    this.delayWetGain.gain.value = 0.35;

    // Delay loop
    this.delayNode.connect(this.delayDampFilter);
    this.delayDampFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayDampFilter.connect(this.delayWetGain);
    this.delayWetGain.connect(this.fxGain);

    // FX Master output
    this.fxGain.connect(this.fxAnalyser);
    this.fxGain.connect(this.masterGain);
  }

  private setupMusicChain() {
    if (!this.ctx || !this.masterGain || !this.reverbPreDelay || !this.delayNode) return;

    this.soundboardAnalyser = this.ctx.createAnalyser();
    this.soundboardAnalyser.fftSize = 256;

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.8;

    this.musicAnalyser = this.ctx.createAnalyser();
    this.musicAnalyser.fftSize = 256;

    // Music 4-Band EQ
    this.musicEQ.sub = this.ctx.createBiquadFilter();
    this.musicEQ.sub.type = 'lowshelf';
    this.musicEQ.sub.frequency.value = 60;

    this.musicEQ.bass = this.ctx.createBiquadFilter();
    this.musicEQ.bass.type = 'peaking';
    this.musicEQ.bass.frequency.value = 250;

    this.musicEQ.mid = this.ctx.createBiquadFilter();
    this.musicEQ.mid.type = 'peaking';
    this.musicEQ.mid.frequency.value = 1500;

    this.musicEQ.treble = this.ctx.createBiquadFilter();
    this.musicEQ.treble.type = 'highshelf';
    this.musicEQ.treble.frequency.value = 10000;

    // Vocal cut / Notch filter (Karaoke Vocal Remover mode)
    this.vocalCutFilter = this.ctx.createBiquadFilter();
    this.vocalCutFilter.type = 'peaking';
    this.vocalCutFilter.frequency.value = 1800;
    this.vocalCutFilter.Q.value = 2.0;
    this.vocalCutFilter.gain.value = 0; // inactive by default

    this.musicPan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    this.musicReverbSend = this.ctx.createGain();
    this.musicReverbSend.gain.value = 0.05;

    this.musicDelaySend = this.ctx.createGain();
    this.musicDelaySend.gain.value = 0;

    // Music node chain: Input -> sub -> bass -> mid -> treble -> vocalCut -> Pan -> MusicGain
    this.musicEQ.sub
      .connect(this.musicEQ.bass)
      .connect(this.musicEQ.mid)
      .connect(this.musicEQ.treble)
      .connect(this.vocalCutFilter);

    if (this.musicPan) {
      this.vocalCutFilter.connect(this.musicPan);
      this.musicPan.connect(this.musicGain);
    } else {
      this.vocalCutFilter.connect(this.musicGain);
    }

    this.musicGain.connect(this.musicAnalyser);
    this.musicGain.connect(this.masterGain);

    // FX sends
    this.musicGain.connect(this.musicReverbSend);
    this.musicReverbSend.connect(this.reverbPreDelay);

    this.musicGain.connect(this.musicDelaySend);
    this.musicDelaySend.connect(this.delayNode);
  }

  private setupSoundboardBus() {
    if (!this.ctx || !this.masterGain || !this.reverbPreDelay || !this.delayNode) return;

    this.soundboardAnalyser = this.ctx.createAnalyser();
    this.soundboardAnalyser.fftSize = 256;

    this.soundboardGain = this.ctx.createGain();
    this.soundboardGain.gain.value = 0.9;
    this.soundboardGain.connect(this.soundboardAnalyser);
    this.soundboardAnalyser.connect(this.masterGain);
  }

  public async setupMicChain(deviceId?: string): Promise<boolean> {
    if (!this.ctx || !this.masterGain || !this.reverbPreDelay || !this.delayNode) return false;

    try {
      if (this.micStream) {
        this.micStream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      };

      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentDeviceId = deviceId || '';

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);

      this.micPreamp = this.ctx.createGain();
      this.micPreamp.gain.value = 1.0;

      this.micHPF = this.ctx.createBiquadFilter();
      this.micHPF.type = 'highpass';
      this.micHPF.frequency.value = 80;

      // Vocal 5-Band Parametric EQ
      this.micEQ.sub = this.ctx.createBiquadFilter();
      this.micEQ.sub.type = 'lowshelf';
      this.micEQ.sub.frequency.value = 60;

      this.micEQ.bass = this.ctx.createBiquadFilter();
      this.micEQ.bass.type = 'peaking';
      this.micEQ.bass.frequency.value = 250;
      this.micEQ.bass.Q.value = 1.2;

      this.micEQ.mid = this.ctx.createBiquadFilter();
      this.micEQ.mid.type = 'peaking';
      this.micEQ.mid.frequency.value = 1500;
      this.micEQ.mid.Q.value = 1.4;

      this.micEQ.high = this.ctx.createBiquadFilter();
      this.micEQ.high.type = 'peaking';
      this.micEQ.high.frequency.value = 4000;
      this.micEQ.high.Q.value = 1.2;

      this.micEQ.treble = this.ctx.createBiquadFilter();
      this.micEQ.treble.type = 'highshelf';
      this.micEQ.treble.frequency.value = 10000;

      // Vocal Compressor
      this.micCompressor = this.ctx.createDynamicsCompressor();
      this.micCompressor.threshold.value = -18;
      this.micCompressor.knee.value = 6;
      this.micCompressor.ratio.value = 3.5;
      this.micCompressor.attack.value = 0.005;
      this.micCompressor.release.value = 0.15;

      // Voice FX Filters
      this.voiceFXFilter1 = this.ctx.createBiquadFilter();
      this.voiceFXFilter1.type = 'allpass';
      this.voiceFXFilter2 = this.ctx.createBiquadFilter();
      this.voiceFXFilter2.type = 'allpass';

      this.micPan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      this.micChannelGain = this.ctx.createGain();
      this.micChannelGain.gain.value = 0.8;

      this.micReverbSend = this.ctx.createGain();
      this.micReverbSend.gain.value = 0.35;

      this.micDelaySend = this.ctx.createGain();
      this.micDelaySend.gain.value = 0.25;

      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 256;

      // Connect Chain: MicSource -> Preamp -> HPF -> EQ Sub -> Bass -> Mid -> High -> Treble -> Comp -> VoiceFX -> Pan -> MicChannelGain
      this.micSource.connect(this.micPreamp);
      this.micPreamp.connect(this.micHPF);
      this.micHPF.connect(this.micEQ.sub);

      this.micEQ.sub
        .connect(this.micEQ.bass)
        .connect(this.micEQ.mid)
        .connect(this.micEQ.high)
        .connect(this.micEQ.treble)
        .connect(this.micCompressor)
        .connect(this.voiceFXFilter1)
        .connect(this.voiceFXFilter2);

      if (this.micPan) {
        this.voiceFXFilter2.connect(this.micPan);
        this.micPan.connect(this.micChannelGain);
      } else {
        this.voiceFXFilter2.connect(this.micChannelGain);
      }

      this.micChannelGain.connect(this.micAnalyser);
      this.micChannelGain.connect(this.masterGain);

      // Aux Sends to FX Bus
      this.micChannelGain.connect(this.micReverbSend);
      this.micReverbSend.connect(this.reverbPreDelay);

      this.micChannelGain.connect(this.micDelaySend);
      this.micDelaySend.connect(this.delayNode);

      this.micConnected = true;
      return true;
    } catch (err) {
      console.warn('Microphone access denied or not found:', err);
      this.micConnected = false;
      return false;
    }
  }

  // Bind an audio element (like backing track or HTML5 player) into the music chain
  public attachAudioElement(el: HTMLAudioElement) {
    if (!this.ctx || !this.musicEQ.sub) return;
    try {
      if (!this.audioSourceNode) {
        this.audioElement = el;
        this.audioSourceNode = this.ctx.createMediaElementSource(el);
        this.audioSourceNode.connect(this.musicEQ.sub);
      }
    } catch (err) {
      console.warn('Audio element already attached or CORS error:', err);
    }
  }

  // Real-time Controls
  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setSoundboardVolume(val: number) {
    if (this.soundboardGain && this.ctx) {
      this.soundboardGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  public setSoundboardMute(isMuted: boolean, previousVol: number) {
    if (this.soundboardGain && this.ctx) {
      const targetVol = isMuted ? 0 : previousVol;
      this.soundboardGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
    }
  }

  public setMicVolume(val: number) {
    if (this.micChannelGain && this.ctx) {
      const target = this.micMuted ? 0 : val;
      this.micChannelGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }
  }

  public setMicPreamp(val: number) {
    if (this.micPreamp && this.ctx) {
      this.micPreamp.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setMusicVolume(val: number) {
    if (this.musicGain && this.ctx) {
      const target = this.musicMuted ? 0 : val;
      this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }
  }

  public setFXVolume(val: number) {
    if (this.fxGain && this.ctx) {
      const target = this.fxMuted ? 0 : val;
      this.fxGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    }
  }

  public setMicMute(muted: boolean, originalVolume: number) {
    this.micMuted = muted;
    if (this.micChannelGain && this.ctx) {
      this.micChannelGain.gain.setTargetAtTime(muted ? 0 : originalVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setMusicMute(muted: boolean, originalVolume: number) {
    this.musicMuted = muted;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(muted ? 0 : originalVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setFXMute(muted: boolean, originalVolume: number) {
    this.fxMuted = muted;
    if (this.fxGain && this.ctx) {
      this.fxGain.gain.setTargetAtTime(muted ? 0 : originalVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setMicPan(val: number) {
    if (this.micPan && this.ctx) {
      this.micPan.pan.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setMusicPan(val: number) {
    if (this.musicPan && this.ctx) {
      this.musicPan.pan.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setMicReverbSend(val: number) {
    if (this.micReverbSend && this.ctx) {
      this.micReverbSend.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setMicDelaySend(val: number) {
    if (this.micDelaySend && this.ctx) {
      this.micDelaySend.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setMusicReverbSend(val: number) {
    if (this.musicReverbSend && this.ctx) {
      this.musicReverbSend.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setMusicDelaySend(val: number) {
    if (this.musicDelaySend && this.ctx) {
      this.musicDelaySend.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  // Vocal EQ Parametric Updates
  public setVocalEQ(eq: VocalEQSettings) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.micEQ.sub) this.micEQ.sub.gain.setTargetAtTime(eq.sub, t, 0.02);
    if (this.micEQ.bass) this.micEQ.bass.gain.setTargetAtTime(eq.bass, t, 0.02);
    if (this.micEQ.mid) this.micEQ.mid.gain.setTargetAtTime(eq.mid, t, 0.02);
    if (this.micEQ.high) this.micEQ.high.gain.setTargetAtTime(eq.high, t, 0.02);
    if (this.micEQ.treble) this.micEQ.treble.gain.setTargetAtTime(eq.treble, t, 0.02);

    if (this.micHPF) {
      this.micHPF.frequency.setTargetAtTime(eq.lowCut ? 80 : 20, t, 0.02);
    }
  }

  // Music EQ Updates
  public setMusicEQ(eq: MusicEQSettings) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.musicEQ.sub) this.musicEQ.sub.gain.setTargetAtTime(eq.sub, t, 0.02);
    if (this.musicEQ.bass) this.musicEQ.bass.gain.setTargetAtTime(eq.bass, t, 0.02);
    if (this.musicEQ.mid) this.musicEQ.mid.gain.setTargetAtTime(eq.mid, t, 0.02);
    if (this.musicEQ.treble) this.musicEQ.treble.gain.setTargetAtTime(eq.treble, t, 0.02);

    this.vocalCutActive = eq.vocalCut;
    if (this.vocalCutFilter) {
      this.vocalCutFilter.gain.setTargetAtTime(eq.vocalCut ? -14 : 0, t, 0.02);
    }
  }

  // FX Updates
  public setFXSettings(fx: FXSettings) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.reverbPreDelay) this.reverbPreDelay.delayTime.setTargetAtTime(fx.reverbPreDelay / 1000, t, 0.02);
    if (this.reverbDampFilter) this.reverbDampFilter.frequency.setTargetAtTime(fx.reverbDamp, t, 0.02);
    if (this.reverbWetGain) this.reverbWetGain.gain.setTargetAtTime(fx.reverbMix, t, 0.02);

    if (this.delayNode) this.delayNode.delayTime.setTargetAtTime(fx.delayTime, t, 0.02);
    if (this.delayFeedbackGain) this.delayFeedbackGain.gain.setTargetAtTime(fx.delayFeedback, t, 0.02);
    if (this.delayDampFilter) this.delayDampFilter.frequency.setTargetAtTime(fx.delayTone, t, 0.02);
    if (this.delayWetGain) this.delayWetGain.gain.setTargetAtTime(fx.delayMix, t, 0.02);
  }

  public updateReverbType(type: ReverbType, duration: number, damping: number = 8000) {
    if (!this.ctx || !this.reverbConvolver) return;
    this.reverbConvolver.buffer = generateImpulseResponse(this.ctx, duration, type, damping);
  }

  // Dynamics Settings (Compressor)
  public setDynamics(dyn: DynamicsSettings) {
    if (!this.ctx || !this.micCompressor) return;
    const t = this.ctx.currentTime;
    if (dyn.compEnabled) {
      this.micCompressor.threshold.setTargetAtTime(dyn.compThreshold, t, 0.02);
      this.micCompressor.ratio.setTargetAtTime(dyn.compRatio, t, 0.02);
      this.micCompressor.attack.setTargetAtTime(dyn.compAttack, t, 0.02);
      this.micCompressor.release.setTargetAtTime(dyn.compRelease, t, 0.02);
    } else {
      this.micCompressor.ratio.setTargetAtTime(1, t, 0.02);
    }
  }

  // Voice FX Filter simulation
  public setVoiceFX(preset: VoiceFXPreset) {
    this.activeVoiceFX = preset;
    if (!this.ctx || !this.voiceFXFilter1 || !this.voiceFXFilter2) return;
    const t = this.ctx.currentTime;

    switch (preset) {
      case 'radio':
        this.voiceFXFilter1.type = 'highpass';
        this.voiceFXFilter1.frequency.setTargetAtTime(450, t, 0.02);
        this.voiceFXFilter2.type = 'lowpass';
        this.voiceFXFilter2.frequency.setTargetAtTime(3200, t, 0.02);
        break;
      case 'robot':
        this.voiceFXFilter1.type = 'peaking';
        this.voiceFXFilter1.frequency.setTargetAtTime(600, t, 0.02);
        this.voiceFXFilter1.gain.setTargetAtTime(12, t, 0.02);
        this.voiceFXFilter1.Q.setTargetAtTime(8, t, 0.02);
        this.voiceFXFilter2.type = 'peaking';
        this.voiceFXFilter2.frequency.setTargetAtTime(1400, t, 0.02);
        this.voiceFXFilter2.gain.setTargetAtTime(10, t, 0.02);
        break;
      case 'deep':
        this.voiceFXFilter1.type = 'lowshelf';
        this.voiceFXFilter1.frequency.setTargetAtTime(200, t, 0.02);
        this.voiceFXFilter1.gain.setTargetAtTime(8, t, 0.02);
        this.voiceFXFilter2.type = 'highshelf';
        this.voiceFXFilter2.frequency.setTargetAtTime(4000, t, 0.02);
        this.voiceFXFilter2.gain.setTargetAtTime(-8, t, 0.02);
        break;
      case 'helium':
        this.voiceFXFilter1.type = 'highpass';
        this.voiceFXFilter1.frequency.setTargetAtTime(300, t, 0.02);
        this.voiceFXFilter2.type = 'peaking';
        this.voiceFXFilter2.frequency.setTargetAtTime(2800, t, 0.02);
        this.voiceFXFilter2.gain.setTargetAtTime(9, t, 0.02);
        break;
      case 'warm':
        this.voiceFXFilter1.type = 'peaking';
        this.voiceFXFilter1.frequency.setTargetAtTime(350, t, 0.02);
        this.voiceFXFilter1.gain.setTargetAtTime(4, t, 0.02);
        this.voiceFXFilter2.type = 'highshelf';
        this.voiceFXFilter2.frequency.setTargetAtTime(8000, t, 0.02);
        this.voiceFXFilter2.gain.setTargetAtTime(2, t, 0.02);
        break;
      case 'normal':
      default:
        this.voiceFXFilter1.type = 'allpass';
        this.voiceFXFilter2.type = 'allpass';
        break;
    }
  }

  // Soundboard Trigger Methods
  public triggerKetawa() {
    if (this.ctx && this.soundboardGain) playKetawa(this.ctx, this.soundboardGain);
  }

  public triggerApplause() {
    if (this.ctx && this.soundboardGain) playApplause(this.ctx, this.soundboardGain);
  }

  public triggerAirHorn() {
    if (this.ctx && this.soundboardGain) playAirHorn(this.ctx, this.soundboardGain);
  }

  public triggerRimshot() {
    if (this.ctx && this.soundboardGain) playRimshot(this.ctx, this.soundboardGain);
  }

  public triggerLaser() {
    if (this.ctx && this.soundboardGain) playLaser(this.ctx, this.soundboardGain);
  }

  public triggerSubDrop() {
    if (this.ctx && this.soundboardGain) playSubDrop(this.ctx, this.soundboardGain);
  }

  public triggerDJDrop() {
    if (this.ctx && this.soundboardGain) playDJDrop(this.ctx, this.soundboardGain);
  }

  // Play audio buffer (for custom uploaded sounds)
  public playBuffer(buffer: AudioBuffer) {
    if (!this.ctx || !this.soundboardGain) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.soundboardGain);
    source.start();
  }

  // Master Session Recording
  public startRecording(): boolean {
    if (!this.mediaDest) return false;
    try {
      this.recordedChunks = [];
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        this.mediaRecorder = new MediaRecorder(this.mediaDest.stream, options);
      } else {
        this.mediaRecorder = new MediaRecorder(this.mediaDest.stream);
      }

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.recordingDuration = 0;
      this.recordTimer = window.setInterval(() => {
        this.recordingDuration += 1;
      }, 1000);

      return true;
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      return false;
    }
  }

  public stopRecording(): Promise<{ blob: Blob; url: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Recording not active'));
        return;
      }

      if (this.recordTimer) clearInterval(this.recordTimer);
      const finalDuration = this.recordingDuration;
      this.isRecording = false;

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, duration: finalDuration });
      };

      this.mediaRecorder.stop();
    });
  }

  // Utility to get audio devices list
  public static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
