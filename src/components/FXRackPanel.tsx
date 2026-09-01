import React from 'react';
import { FXSettings, ReverbType } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { Knob } from './Knob';
import { Layers, Sparkles, Waves } from 'lucide-react';

interface FXRackPanelProps {
  fx: FXSettings;
  onFXChange: (newFX: FXSettings) => void;
}

export const FXRackPanel: React.FC<FXRackPanelProps> = ({
  fx,
  onFXChange,
}) => {
  const handleFXParam = (param: keyof FXSettings, val: any) => {
    const updated = { ...fx, [param]: val };
    onFXChange(updated);
    audioEngine.setFXSettings(updated);

    if (param === 'reverbType' || param === 'reverbDecay' || param === 'reverbDamp') {
      audioEngine.updateReverbType(
        param === 'reverbType' ? val : fx.reverbType,
        param === 'reverbDecay' ? val : fx.reverbDecay,
        param === 'reverbDamp' ? val : fx.reverbDamp
      );
    }
  };

  const handleReverbTypeSelect = (type: ReverbType) => {
    let decay = fx.reverbDecay;
    switch (type) {
      case 'plate': decay = 2.8; break;
      case 'room': decay = 1.0; break;
      case 'hall': decay = 2.4; break;
      case 'cathedral': decay = 4.2; break;
      case 'stadium': decay = 3.6; break;
    }
    handleFXParam('reverbType', type);
    handleFXParam('reverbDecay', decay);
  };

  const applyDelaySync = (ms: number) => {
    handleFXParam('delayTime', ms / 1000);
  };

  return (
    <div className="bg-[#121620] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-3 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232a38] pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              DSP Dual FX Rack (Convolver Reverb & Tape Delay)
            </h2>
            <p className="text-[10px] text-slate-400">Zero-Latency Algorithmic FX Processor</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* REVERB PROCESSOR */}
        <div className="bg-[#0e1219] p-3 rounded-lg border border-[#202735] flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-[#1c2330] pb-1.5">
            <span className="text-[11px] font-mono font-bold text-purple-400 flex items-center gap-1.5 uppercase">
              <Layers className="w-3.5 h-3.5" />
              Acoustic Convolver Reverb
            </span>
            <span className="text-[9px] font-mono text-purple-300/80 uppercase">
              {fx.reverbType} space
            </span>
          </div>

          {/* Space Archetypes */}
          <div className="grid grid-cols-5 gap-1">
            {[
              { key: 'hall' as ReverbType, label: 'Hall' },
              { key: 'plate' as ReverbType, label: 'Plate' },
              { key: 'room' as ReverbType, label: 'Room' },
              { key: 'cathedral' as ReverbType, label: 'Cathedral' },
              { key: 'stadium' as ReverbType, label: 'Stadium' },
            ].map((space) => (
              <button
                key={space.key}
                onClick={() => handleReverbTypeSelect(space.key)}
                className={`py-1 rounded text-[10px] font-mono font-semibold transition-all border ${
                  fx.reverbType === space.key
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-sm'
                    : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
                }`}
              >
                {space.label}
              </button>
            ))}
          </div>

          {/* Reverb Knobs */}
          <div className="grid grid-cols-4 gap-1 justify-items-center pt-1">
            <Knob
              label="Decay"
              value={fx.reverbDecay}
              min={0.2}
              max={6.0}
              step={0.1}
              defaultValue={2.4}
              unit="s"
              color="purple"
              size="sm"
              onChange={(val) => handleFXParam('reverbDecay', val)}
            />
            <Knob
              label="Pre-Dly"
              value={fx.reverbPreDelay}
              min={0}
              max={80}
              step={5}
              defaultValue={20}
              unit="ms"
              color="purple"
              size="sm"
              onChange={(val) => handleFXParam('reverbPreDelay', val)}
            />
            <Knob
              label="Damping"
              value={fx.reverbDamp}
              min={2000}
              max={16000}
              step={500}
              defaultValue={8000}
              unit="Hz"
              color="purple"
              size="sm"
              formatValue={(v) => `${(v / 1000).toFixed(1)}k`}
              onChange={(val) => handleFXParam('reverbDamp', val)}
            />
            <Knob
              label="Wet Mix"
              value={fx.reverbMix}
              min={0}
              max={1}
              step={0.02}
              defaultValue={0.42}
              unit="%"
              color="purple"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => handleFXParam('reverbMix', val)}
            />
          </div>
        </div>

        {/* STEREO DELAY / ECHO */}
        <div className="bg-[#0e1219] p-3 rounded-lg border border-[#202735] flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-[#1c2330] pb-1.5">
            <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase">
              <Waves className="w-3.5 h-3.5" />
              Stereo Ping-Pong Echo Delay
            </span>
            <button
              onClick={() => handleFXParam('delayPingPong', !fx.delayPingPong)}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                fx.delayPingPong
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                  : 'bg-[#151a24] text-slate-500 border-[#242c3b]'
              }`}
            >
              {fx.delayPingPong ? 'PING-PONG ON' : 'MONO ECHO'}
            </button>
          </div>

          {/* Quick Delay Sync Presets */}
          <div className="flex gap-1">
            {[
              { label: 'Slap (80ms)', ms: 80 },
              { label: '1/8 (250ms)', ms: 250 },
              { label: 'Dotted (375ms)', ms: 375 },
              { label: '1/4 (500ms)', ms: 500 },
            ].map((sync) => (
              <button
                key={sync.label}
                onClick={() => applyDelaySync(sync.ms)}
                className={`flex-1 py-1 rounded text-[9px] font-mono font-semibold transition-all border ${
                  Math.round(fx.delayTime * 1000) === sync.ms
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                    : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
                }`}
              >
                {sync.label}
              </button>
            ))}
          </div>

          {/* Delay Knobs */}
          <div className="grid grid-cols-4 gap-1 justify-items-center pt-1">
            <Knob
              label="Time"
              value={Math.round(fx.delayTime * 1000)}
              min={20}
              max={1000}
              step={10}
              defaultValue={280}
              unit="ms"
              color="amber"
              size="sm"
              onChange={(val) => handleFXParam('delayTime', val / 1000)}
            />
            <Knob
              label="Feedback"
              value={fx.delayFeedback}
              min={0}
              max={0.85}
              step={0.02}
              defaultValue={0.38}
              unit="%"
              color="amber"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => handleFXParam('delayFeedback', val)}
            />
            <Knob
              label="Tone Filter"
              value={fx.delayTone}
              min={1000}
              max={12000}
              step={500}
              defaultValue={6000}
              unit="Hz"
              color="amber"
              size="sm"
              formatValue={(v) => `${(v / 1000).toFixed(1)}k`}
              onChange={(val) => handleFXParam('delayTone', val)}
            />
            <Knob
              label="Wet Mix"
              value={fx.delayMix}
              min={0}
              max={1}
              step={0.02}
              defaultValue={0.35}
              unit="%"
              color="amber"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => handleFXParam('delayMix', val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
