import React, { useState, useEffect } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { Activity, Check, Mic, Play, Settings, Square, Volume2, X } from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [activeTestTone, setActiveTestTone] = useState<string | null>(null);
  const [testToneNode, setTestToneNode] = useState<{ osc?: OscillatorNode; noise?: AudioNode; gain: GainNode } | null>(null);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.enumerateDevices().then(devs => {
        const audioInputs = devs.filter(d => d.kind === 'audioinput');
        setDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      });
    }
  }, [isOpen, selectedDeviceId]);

  if (!isOpen) return null;

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (audioEngine.isRunning) {
      await audioEngine.setupMicChain(deviceId);
    }
  };

  const playTestTone = (type: 'sine1k' | 'sine440' | 'pink' | 'white') => {
    if (!audioEngine.ctx || !audioEngine.masterGain) {
      alert('Aktifkan Audio Engine terlebih dahulu!');
      return;
    }

    // Stop current tone if running
    if (testToneNode) {
      stopTestTone();
      if (activeTestTone === type) return;
    }

    const ctx = audioEngine.ctx;
    const gain = ctx.createGain();
    gain.gain.value = 0.15; // Safe test level
    gain.connect(audioEngine.masterGain);

    if (type === 'sine1k' || type === 'sine440') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = type === 'sine1k' ? 1000 : 440;
      osc.connect(gain);
      osc.start();
      setTestToneNode({ osc, gain });
    } else if (type === 'white') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(gain);
      noise.start();
      setTestToneNode({ noise, gain });
    } else if (type === 'pink') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(gain);
      noise.start();
      setTestToneNode({ noise, gain });
    }

    setActiveTestTone(type);
  };

  const stopTestTone = () => {
    if (testToneNode) {
      if (testToneNode.osc) testToneNode.osc.stop();
      if (testToneNode.noise) (testToneNode.noise as AudioScheduledSourceNode).stop?.();
      testToneNode.gain.disconnect();
      setTestToneNode(null);
      setActiveTestTone(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151922] border border-[#2b3547] rounded-xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252d3d] pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold font-mono uppercase text-slate-100">
                DSP Engine & Hardware I/O Settings
              </h2>
              <p className="text-xs text-slate-400">Microphone Routing & Acoustic Calibration</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopTestTone();
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#202735]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Device Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            PILIH PERANGKAT MICROPHONE / AUDIO INTERFACE:
          </label>
          <select
            value={selectedDeviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full bg-[#0e1219] border border-[#283244] rounded-md px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {devices.length > 0 ? (
              devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Microphone Input ${i + 1}`}
                </option>
              ))
            ) : (
              <option value="">Default System Microphone</option>
            )}
          </select>
        </div>

        {/* Audio Engine Specs Box */}
        <div className="bg-[#0e1219] p-3 rounded-lg border border-[#202735] grid grid-cols-2 gap-2 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">Sample Rate:</span>
            <strong className="text-emerald-400">
              {audioEngine.ctx?.sampleRate || 48000} Hz
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">DSP Engine Mode:</span>
            <strong className="text-cyan-400">Zero-Latency Interactive</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Mic Preprocessing:</span>
            <strong className="text-slate-200">Raw Direct Low-Latency</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Master Limiter:</span>
            <strong className="text-emerald-400">Active Soft-Knee</strong>
          </div>
        </div>

        {/* Test Tone & Calibration Section */}
        <div className="bg-[#0e1219] p-3 rounded-lg border border-[#202735] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Generator Kalibrasi & Nada Uji:
            </span>
            {activeTestTone && (
              <button
                onClick={stopTestTone}
                className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1"
              >
                <Square className="w-3 h-3 fill-rose-300" />
                Stop Test Tone
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'sine1k' as const, label: '1 kHz Sine Wave (0dB Ref)' },
              { type: 'sine440' as const, label: '440 Hz Pitch Standard (A4)' },
              { type: 'pink' as const, label: 'Pink Noise (RTA Acoustic)' },
              { type: 'white' as const, label: 'White Noise (Full Band)' },
            ].map((t) => (
              <button
                key={t.type}
                onClick={() => playTestTone(t.type)}
                className={`p-2 rounded text-[10px] font-mono font-semibold transition-all border text-left flex items-center justify-between ${
                  activeTestTone === t.type
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                    : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
                }`}
              >
                <span>{t.label}</span>
                {activeTestTone === t.type ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#252d3d]">
          <button
            onClick={() => {
              stopTestTone();
              onClose();
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-1.5 rounded-md text-xs font-mono font-extrabold uppercase transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
