import React, { useState } from 'react';
import { audioEngine } from '../audio/audioEngine';
import {
  FolderOpen,
  Keyboard,
  Maximize2,
  Minimize2,
  Power,
  Save,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  onOpenPresets: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onConnectAudio: () => void;
  isEngineRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPresets,
  onOpenSettings,
  onOpenShortcuts,
  onConnectAudio,
  isEngineRunning,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#0b0e14] via-[#141924] to-[#0f141d] border-b-2 border-cyan-500/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Zap className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-wider text-cyan-400 uppercase drop-shadow-[0_0_12px_rgba(0,229,255,0.5)] font-mono leading-none">
            Bambang Mixer Audio Pro
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1.5 mt-0.5">
            <span>PRO DSP CONSOLE</span>
            <span>•</span>
            <span>KARAOKE & VOCAL PROCESSOR</span>
          </p>
        </div>
      </div>

      {/* Center Status Display */}
      <div className="hidden lg:flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded-full border border-[#232b3b]">
        <span className="text-[11px] font-mono text-slate-400">Mode Audio:</span>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isEngineRunning
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <strong
            className={`text-xs font-mono font-bold ${
              isEngineRunning ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {isEngineRunning ? 'Zero-Latency DSP Active' : 'Engine Standby'}
          </strong>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Main Connect / Power Button */}
        <button
          id="btn-start-audio"
          onClick={onConnectAudio}
          className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-extrabold uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95 border ${
            isEngineRunning
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-emerald-500/20'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-cyan-500/30 animate-pulse'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {isEngineRunning ? '⚡ Audio Engine Running' : '🔌 Connect Audio Engine'}
        </button>

        {/* Presets Button */}
        <button
          id="btn-open-presets"
          onClick={onOpenPresets}
          className="bg-[#181f2c] hover:bg-[#253045] text-slate-200 border border-[#2e3b52] hover:border-cyan-400 px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          Presets
        </button>

        {/* Audio Hardware Settings */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="bg-[#181f2c] hover:bg-[#253045] text-slate-200 border border-[#2e3b52] p-1.5 rounded-md text-xs transition-all"
          title="Hardware Audio Settings & Calibration"
        >
          <Settings className="w-4 h-4 text-slate-300" />
        </button>

        {/* Hotkeys Cheat Sheet */}
        <button
          id="btn-open-shortcuts"
          onClick={onOpenShortcuts}
          className="bg-[#181f2c] hover:bg-[#253045] text-slate-200 border border-[#2e3b52] p-1.5 rounded-md text-xs transition-all"
          title="Keyboard Shortcuts Cheat Sheet"
        >
          <Keyboard className="w-4 h-4 text-slate-300" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="bg-[#181f2c] hover:bg-[#253045] text-slate-200 border border-[#2e3b52] p-1.5 rounded-md text-xs transition-all"
          title="Toggle Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-300" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
        </button>
      </div>
    </header>
  );
};
