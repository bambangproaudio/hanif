import React from 'react';
import { Knob } from './Knob';
import { Fader } from './Fader';
import { VUMeter } from './VUMeter';
import { audioEngine } from '../audio/audioEngine';
import { Mic, Music2, Sparkles, Sliders } from 'lucide-react';

interface ChannelStripsProps {
  micVol: number;
  musicVol: number;
  fxVol: number;
  soundboardVol: number;
  micMuted: boolean;
  musicMuted: boolean;
  fxMuted: boolean;
  soundboardMuted: boolean;
  micPan: number;
  musicPan: number;
  micPreamp: number;
  micRevSend: number;
  micDelaySend: number;
  musicRevSend: number;
  onMicVolChange: (val: number) => void;
  onMusicVolChange: (val: number) => void;
  onFxVolChange: (val: number) => void;
  onSoundboardVolChange: (val: number) => void;
  onMicMuteToggle: () => void;
  onMusicMuteToggle: () => void;
  onFxMuteToggle: () => void;
  onSoundboardMuteToggle: () => void;
  onMicPanChange: (val: number) => void;
  onMusicPanChange: (val: number) => void;
  onMicPreampChange: (val: number) => void;
  onMicRevSendChange: (val: number) => void;
  onMicDelaySendChange: (val: number) => void;
  onMusicRevSendChange: (val: number) => void;
}

export const ChannelStrips: React.FC<ChannelStripsProps> = ({
  micVol,
  musicVol,
  fxVol,
  soundboardVol,
  micMuted,
  musicMuted,
  fxMuted,
  soundboardMuted,
  micPan,
  musicPan,
  micPreamp,
  micRevSend,
  micDelaySend,
  musicRevSend,
  onMicVolChange,
  onMusicVolChange,
  onFxVolChange,
  onSoundboardVolChange,
  onMicMuteToggle,
  onMusicMuteToggle,
  onFxMuteToggle,
  onSoundboardMuteToggle,
  onMicPanChange,
  onMusicPanChange,
  onMicPreampChange,
  onMicRevSendChange,
  onMicDelaySendChange,
  onMusicRevSendChange,
}) => {
  return (
    <div className="bg-[#121620] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-3 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#232a38] pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
            Channel Strips & Matrix Bus
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Zero-Latency DSP Bus</span>
      </div>

      {/* Horizontal Strip Deck */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* STRIP 1: MIC IN */}
        <div className="bg-[#161b26] border border-[#2b3547] rounded-lg p-2.5 flex flex-col items-center gap-2 shadow-md">
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-[#242e40] pb-1.5">
            <span className="text-[11px] font-mono font-extrabold text-cyan-400 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              CH 1: MIC IN
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                audioEngine.micConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </div>

          {/* Preamp Trim & Pan */}
          <div className="grid grid-cols-2 gap-1 w-full justify-items-center">
            <Knob
              label="Preamp"
              value={micPreamp}
              min={0.2}
              max={2.0}
              step={0.05}
              defaultValue={1.0}
              unit="x"
              color="cyan"
              size="sm"
              onChange={onMicPreampChange}
            />
            <Knob
              label="Pan"
              value={micPan}
              min={-1}
              max={1}
              step={0.05}
              defaultValue={0}
              color="blue"
              size="sm"
              formatValue={(v) => (v === 0 ? 'C' : v < 0 ? `L${Math.abs(Math.round(v * 100))}` : `R${Math.round(v * 100)}`)}
              onChange={onMicPanChange}
            />
          </div>

          {/* Aux FX Sends */}
          <div className="grid grid-cols-2 gap-1 w-full justify-items-center bg-[#0e121a] p-1.5 rounded border border-[#202735]">
            <Knob
              label="Reverb"
              value={micRevSend}
              min={0}
              max={1}
              step={0.02}
              defaultValue={0.35}
              unit="%"
              color="purple"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={onMicRevSendChange}
            />
            <Knob
              label="Delay"
              value={micDelaySend}
              min={0}
              max={1}
              step={0.02}
              defaultValue={0.25}
              unit="%"
              color="amber"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={onMicDelaySendChange}
            />
          </div>

          {/* Mute Button */}
          <button
            id="btn-mute-mic"
            onClick={onMicMuteToggle}
            className={`w-full py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border ${
              micMuted
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-[#1e2533] text-slate-300 border-[#323d52] hover:bg-[#283244] hover:text-white'
            }`}
          >
            {micMuted ? 'MUTED' : 'MUTE'}
          </button>

          {/* Fader & VU Meter Group */}
          <div className="flex items-center justify-center gap-2 w-full pt-1 flex-1">
            <Fader
              label="Mic"
              value={micVol}
              min={0}
              max={1.2}
              color="cyan"
              height={170}
              onChange={onMicVolChange}
              disabled={micMuted}
            />
            <VUMeter
              analyserNode={audioEngine.micAnalyser}
              height={170}
              width={10}
              label="IN"
              isMuted={micMuted}
            />
          </div>
        </div>

        {/* STRIP 2: MUSIC / YT */}
        <div className="bg-[#161b26] border border-[#2b3547] rounded-lg p-2.5 flex flex-col items-center gap-2 shadow-md">
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-[#242e40] pb-1.5">
            <span className="text-[11px] font-mono font-extrabold text-emerald-400 flex items-center gap-1">
              <Music2 className="w-3.5 h-3.5 text-emerald-400" />
              CH 2: MUSIC / YT
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          {/* Music Pan & Aux Send */}
          <div className="grid grid-cols-2 gap-1 w-full justify-items-center">
            <Knob
              label="Pan"
              value={musicPan}
              min={-1}
              max={1}
              step={0.05}
              defaultValue={0}
              color="blue"
              size="sm"
              formatValue={(v) => (v === 0 ? 'C' : v < 0 ? `L${Math.abs(Math.round(v * 100))}` : `R${Math.round(v * 100)}`)}
              onChange={onMusicPanChange}
            />
            <Knob
              label="Reverb"
              value={musicRevSend}
              min={0}
              max={1}
              step={0.02}
              defaultValue={0.05}
              unit="%"
              color="purple"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={onMusicRevSendChange}
            />
          </div>

          {/* Spacer box */}
          <div className="w-full bg-[#0e121a] p-2 rounded border border-[#202735] flex items-center justify-center text-[9px] font-mono text-slate-400">
            STEREO LINE IN
          </div>

          {/* Mute Button */}
          <button
            id="btn-mute-music"
            onClick={onMusicMuteToggle}
            className={`w-full py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border ${
              musicMuted
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-[#1e2533] text-slate-300 border-[#323d52] hover:bg-[#283244] hover:text-white'
            }`}
          >
            {musicMuted ? 'MUTED' : 'MUTE'}
          </button>

          {/* Fader & VU Meter Group */}
          <div className="flex items-center justify-center gap-2 w-full pt-1 flex-1">
            <Fader
              label="Music"
              value={musicVol}
              min={0}
              max={1.2}
              color="green"
              height={170}
              onChange={onMusicVolChange}
              disabled={musicMuted}
            />
            <VUMeter
              analyserNode={audioEngine.musicAnalyser}
              height={170}
              width={10}
              label="LINE"
              isMuted={musicMuted}
            />
          </div>
        </div>

        {/* STRIP 3: SOUNDBOARD */}
        <div className="bg-[#161b26] border border-[#2b3547] rounded-lg p-2.5 flex flex-col items-center gap-2 shadow-md">
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-[#242e40] pb-1.5">
            <span className="text-[11px] font-mono font-extrabold text-fuchsia-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              CH 3: SOUNDBOARD
            </span>
            <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
          </div>

          {/* Spacer box */}
          <div className="w-full h-12 bg-[#0e121a] p-2 rounded border border-[#202735] flex items-center justify-center text-[9px] font-mono text-slate-400">
            FX KETAWA & SOUNDS
          </div>

          {/* Mute Button */}
          <button
            id="btn-mute-soundboard"
            onClick={onSoundboardMuteToggle}
            className={`w-full py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border ${
              soundboardMuted
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-[#1e2533] text-slate-300 border-[#323d52] hover:bg-[#283244] hover:text-white'
            }`}
          >
            {soundboardMuted ? 'MUTED' : 'MUTE'}
          </button>

          {/* Fader & VU Meter Group */}
          <div className="flex items-center justify-center gap-2 w-full pt-1 flex-1">
            <Fader
              label="Sounds"
              value={soundboardVol}
              min={0}
              max={1.2}
              color="fuchsia"
              height={170}
              onChange={onSoundboardVolChange}
              disabled={soundboardMuted}
            />
            <VUMeter
              analyserNode={audioEngine.soundboardAnalyser}
              height={170}
              width={10}
              label="SFX"
              isMuted={soundboardMuted}
            />
          </div>
        </div>

        {/* STRIP 4: FX RETURN */}
        <div className="bg-[#161b26] border border-[#2b3547] rounded-lg p-2.5 flex flex-col items-center gap-2 shadow-md">
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-[#242e40] pb-1.5">
            <span className="text-[11px] font-mono font-extrabold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              CH 4: FX RETURN
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>

          {/* FX Knobs */}
          <div className="grid grid-cols-2 gap-1 w-full justify-items-center">
            <Knob
              label="Rev Wet"
              value={audioEngine.fxGain ? 0.45 : 0}
              min={0}
              max={1}
              step={0.05}
              defaultValue={0.45}
              unit="%"
              color="purple"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => {
                if (audioEngine.reverbWetGain && audioEngine.ctx) {
                  audioEngine.reverbWetGain.gain.setTargetAtTime(val, audioEngine.ctx.currentTime, 0.02);
                }
              }}
            />
            <Knob
              label="Echo Wet"
              value={audioEngine.fxGain ? 0.35 : 0}
              min={0}
              max={1}
              step={0.05}
              defaultValue={0.35}
              unit="%"
              color="amber"
              size="sm"
              formatValue={(v) => `${Math.round(v * 100)}%`}
              onChange={(val) => {
                if (audioEngine.delayWetGain && audioEngine.ctx) {
                  audioEngine.delayWetGain.gain.setTargetAtTime(val, audioEngine.ctx.currentTime, 0.02);
                }
              }}
            />
          </div>

          {/* Spacer box */}
          <div className="w-full bg-[#0e121a] p-2 rounded border border-[#202735] flex items-center justify-center text-[9px] font-mono text-slate-400">
            DSP CONVOLVER & DLY
          </div>

          {/* Mute FX Button */}
          <button
            id="btn-mute-fx"
            onClick={onFxMuteToggle}
            className={`w-full py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border ${
              fxMuted
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-[#1e2533] text-slate-300 border-[#323d52] hover:bg-[#283244] hover:text-white'
            }`}
          >
            {fxMuted ? 'FX MUTED' : 'MUTE FX'}
          </button>

          {/* Fader & VU Meter Group */}
          <div className="flex items-center justify-center gap-2 w-full pt-1 flex-1">
            <Fader
              label="FX Return"
              value={fxVol}
              min={0}
              max={1.2}
              color="amber"
              height={170}
              onChange={onFxVolChange}
              disabled={fxMuted}
            />
            <VUMeter
              analyserNode={audioEngine.fxAnalyser}
              height={170}
              width={10}
              label="FX"
              isMuted={fxMuted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
