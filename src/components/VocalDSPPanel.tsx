import React, { useState } from 'react';
import { VocalEQSettings, VoiceFXPreset, DynamicsSettings } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { Knob } from './Knob';
import { Mic2, Radio, SlidersHorizontal, Sparkles, Wand2, Zap } from 'lucide-react';

interface VocalDSPPanelProps {
  vocalEQ: VocalEQSettings;
  onVocalEQChange: (newEQ: VocalEQSettings) => void;
  voiceFX: VoiceFXPreset;
  onVoiceFXChange: (preset: VoiceFXPreset) => void;
  dynamics: DynamicsSettings;
  onDynamicsChange: (dyn: DynamicsSettings) => void;
}

export const VocalDSPPanel: React.FC<VocalDSPPanelProps> = ({
  vocalEQ,
  onVocalEQChange,
  voiceFX,
  onVoiceFXChange,
  dynamics,
  onDynamicsChange,
}) => {
  const [activePreset, setActivePreset] = useState<string>('custom');

  const handleBandChange = (band: keyof VocalEQSettings, val: number | boolean) => {
    const updated = { ...vocalEQ, [band]: val };
    setActivePreset('custom');
    onVocalEQChange(updated);
    audioEngine.setVocalEQ(updated);
  };

  const applyVocalPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    let newEQ: VocalEQSettings = { ...vocalEQ };

    switch (presetKey) {
      case 'crisp':
        newEQ = { sub: -2, bass: 1, mid: 2, high: 4, treble: 6, lowCut: true };
        break;
      case 'warm':
        newEQ = { sub: 1, bass: 3, mid: 1.5, high: 2, treble: 2.5, lowCut: true };
        break;
      case 'dangdut':
        newEQ = { sub: 0, bass: 1.5, mid: 3.5, high: 5, treble: 6.5, lowCut: true };
        break;
      case 'broadcast':
        newEQ = { sub: -3, bass: 3.5, mid: 4, high: 2.5, treble: 3, lowCut: true };
        break;
      case 'flat':
        newEQ = { sub: 0, bass: 0, mid: 0, high: 0, treble: 0, lowCut: false };
        break;
    }

    onVocalEQChange(newEQ);
    audioEngine.setVocalEQ(newEQ);
  };

  const handleVoiceFXSelect = (preset: VoiceFXPreset) => {
    onVoiceFXChange(preset);
    audioEngine.setVoiceFX(preset);
  };

  const toggleLowCut = () => {
    handleBandChange('lowCut', !vocalEQ.lowCut);
  };

  const toggleCompressor = () => {
    const updated = { ...dynamics, compEnabled: !dynamics.compEnabled };
    onDynamicsChange(updated);
    audioEngine.setDynamics(updated);
  };

  return (
    <div className="bg-[#121620] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-3 shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#232a38] pb-2">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Vocal 5-Band Parametric EQ & DSP Processor
            </h2>
            <p className="text-[10px] text-slate-400">Microphone Channel EQ, High-Pass & Dynamics</p>
          </div>
        </div>

        {/* Low Cut 80Hz Button */}
        <button
          id="btn-vocal-lowcut"
          onClick={toggleLowCut}
          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all border ${
            vocalEQ.lowCut
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm'
              : 'bg-[#1a202c] text-slate-400 border-[#2d3748] hover:text-slate-200'
          }`}
          title="High-Pass Filter 80Hz to cut microphone stage rumble and wind pops"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              vocalEQ.lowCut ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-600'
            }`}
          />
          HPF 80Hz (LOW CUT)
        </button>
      </div>

      {/* 5-Band EQ Rotary Knobs */}
      <div className="bg-[#0e1219] p-3 rounded-lg border border-[#202735]">
        <div className="grid grid-cols-5 gap-2 justify-items-center">
          <Knob
            label="Sub (60Hz)"
            value={vocalEQ.sub}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="cyan"
            size="md"
            onChange={(val) => handleBandChange('sub', val)}
          />
          <Knob
            label="Bass (250Hz)"
            value={vocalEQ.bass}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="green"
            size="md"
            onChange={(val) => handleBandChange('bass', val)}
          />
          <Knob
            label="Mid HQ (1.5k)"
            value={vocalEQ.mid}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="amber"
            size="md"
            onChange={(val) => handleBandChange('mid', val)}
          />
          <Knob
            label="High (4kHz)"
            value={vocalEQ.high}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="red"
            size="md"
            onChange={(val) => handleBandChange('high', val)}
          />
          <Knob
            label="Treble (10k)"
            value={vocalEQ.treble}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="purple"
            size="md"
            onChange={(val) => handleBandChange('treble', val)}
          />
        </div>

        {/* Vocal Presets Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2 border-t border-[#1c2330]">
          <span className="text-[10px] font-mono text-slate-400 mr-1">Vocal Presets:</span>
          {[
            { key: 'crisp', label: 'Crisp Presence' },
            { key: 'warm', label: 'Warm Studio' },
            { key: 'dangdut', label: 'Dangdut Pro' },
            { key: 'broadcast', label: 'Broadcast Radio' },
            { key: 'flat', label: 'Flat Zero' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => applyVocalPreset(item.key)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-all border ${
                activePreset === item.key
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm'
                  : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamics & Voice Effects Sub-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Voice Character FX Presets */}
        <div className="bg-[#0e1219] p-2.5 rounded-lg border border-[#202735] flex flex-col gap-2">
          <div className="flex items-center gap-1.5 border-b border-[#1c2330] pb-1">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
              Voice FX Transform Engine
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { key: 'normal' as VoiceFXPreset, label: 'Standard Clean' },
              { key: 'warm' as VoiceFXPreset, label: 'Warm Body' },
              { key: 'robot' as VoiceFXPreset, label: '🤖 Robot Voice' },
              { key: 'helium' as VoiceFXPreset, label: '🐿️ Helium Pitch' },
              { key: 'deep' as VoiceFXPreset, label: '👹 Monster Deep' },
              { key: 'radio' as VoiceFXPreset, label: '📻 Vintage Radio' },
            ].map((fx) => (
              <button
                key={fx.key}
                onClick={() => handleVoiceFXSelect(fx.key)}
                className={`p-1.5 rounded text-[10px] font-mono font-semibold text-center transition-all border ${
                  voiceFX === fx.key
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-sm shadow-purple-500/20'
                    : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
                }`}
              >
                {fx.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vocal Compressor / Dynamics */}
        <div className="bg-[#0e1219] p-2.5 rounded-lg border border-[#202735] flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-[#1c2330] pb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                Studio Vocal Compressor
              </span>
            </div>
            <button
              onClick={toggleCompressor}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all border ${
                dynamics.compEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                  : 'bg-[#151a24] text-slate-500 border-[#242c3b]'
              }`}
            >
              {dynamics.compEnabled ? 'COMP ON' : 'COMP OFF'}
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1 justify-items-center pt-1">
            <Knob
              label="Thresh"
              value={dynamics.compThreshold}
              min={-40}
              max={0}
              step={1}
              defaultValue={-18}
              unit="dB"
              color="amber"
              size="sm"
              onChange={(val) => {
                const updated = { ...dynamics, compThreshold: val };
                onDynamicsChange(updated);
                audioEngine.setDynamics(updated);
              }}
            />
            <Knob
              label="Ratio"
              value={dynamics.compRatio}
              min={1}
              max={10}
              step={0.5}
              defaultValue={3.5}
              unit=":1"
              color="amber"
              size="sm"
              onChange={(val) => {
                const updated = { ...dynamics, compRatio: val };
                onDynamicsChange(updated);
                audioEngine.setDynamics(updated);
              }}
            />
            <Knob
              label="Attack"
              value={dynamics.compAttack * 1000}
              min={1}
              max={50}
              step={1}
              defaultValue={5}
              unit="ms"
              color="amber"
              size="sm"
              onChange={(val) => {
                const updated = { ...dynamics, compAttack: val / 1000 };
                onDynamicsChange(updated);
                audioEngine.setDynamics(updated);
              }}
            />
            <Knob
              label="Release"
              value={dynamics.compRelease * 1000}
              min={20}
              max={500}
              step={10}
              defaultValue={150}
              unit="ms"
              color="amber"
              size="sm"
              onChange={(val) => {
                const updated = { ...dynamics, compRelease: val / 1000 };
                onDynamicsChange(updated);
                audioEngine.setDynamics(updated);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
