import React, { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { Drum, Play, Sparkles, Upload, Volume2, Edit2, X } from 'lucide-react';

interface CustomSample {
  name: string;
  buffer: AudioBuffer | null;
}

export const SoundboardPanel: React.FC = () => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [customSamples, setCustomSamples] = useState<Record<string, CustomSample>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetPadId = useRef<string>('');

  const triggerFX = (id: string, defaultAction: () => void) => {
    setActivePad(id);
    
    // Play custom sample if it exists, otherwise play default
    if (customSamples[id]?.buffer) {
      audioEngine.playBuffer(customSamples[id].buffer!);
    } else {
      defaultAction();
    }
    
    setTimeout(() => setActivePad(null), 250);
  };

  // Keyboard shortcut listener (1-8)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case '1':
          triggerFX('laugh', () => audioEngine.triggerKetawa());
          break;
        case '2':
          triggerFX('applause', () => audioEngine.triggerApplause());
          break;
        case '3':
          triggerFX('airhorn', () => audioEngine.triggerAirHorn());
          break;
        case '4':
          triggerFX('rimshot', () => audioEngine.triggerRimshot());
          break;
        case '5':
          triggerFX('laser', () => audioEngine.triggerLaser());
          break;
        case '6':
          triggerFX('subdrop', () => audioEngine.triggerSubDrop());
          break;
        case '7':
          triggerFX('djdrop', () => audioEngine.triggerDJDrop());
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customSamples]);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioEngine.ctx) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioEngine.ctx.decodeAudioData(arrayBuffer);
      
      setCustomSamples(prev => ({
        ...prev,
        [targetPadId.current]: {
          name: file.name.slice(0, 15) + (file.name.length > 15 ? '...' : ''),
          buffer: audioBuffer,
        }
      }));
    } catch (err) {
      alert('Format audio tidak didukung atau rusak: ' + (err as Error).message);
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openUploadDialog = (e: React.MouseEvent, padId: string) => {
    e.stopPropagation(); // prevent triggering the pad
    targetPadId.current = padId;
    fileInputRef.current?.click();
  };

  const removeCustomSample = (e: React.MouseEvent, padId: string) => {
    e.stopPropagation();
    setCustomSamples(prev => {
      const newState = { ...prev };
      delete newState[padId];
      return newState;
    });
  };

  const soundboardPads = [
    {
      id: 'laugh',
      label: '😂 Ketawa',
      sub: 'Giggle Burst',
      hotkey: '1',
      action: () => audioEngine.triggerKetawa(),
      color: 'from-amber-500/30 to-amber-600/10 border-amber-500/40 text-amber-300',
    },
    {
      id: 'applause',
      label: '👏 Applause',
      sub: 'Tepuk Tangan',
      hotkey: '2',
      action: () => audioEngine.triggerApplause(),
      color: 'from-emerald-500/30 to-emerald-600/10 border-emerald-500/40 text-emerald-300',
    },
    {
      id: 'airhorn',
      label: '📢 Air Horn',
      sub: 'Terompet DJ',
      hotkey: '3',
      action: () => audioEngine.triggerAirHorn(),
      color: 'from-cyan-500/30 to-cyan-600/10 border-cyan-500/40 text-cyan-300',
    },
    {
      id: 'rimshot',
      label: '🥁 Rimshot',
      sub: 'Ba-Dum-Tss',
      hotkey: '4',
      action: () => audioEngine.triggerRimshot(),
      color: 'from-purple-500/30 to-purple-600/10 border-purple-500/40 text-purple-300',
    },
    {
      id: 'laser',
      label: '🔫 Laser FX',
      sub: 'Sci-Fi Sweep',
      hotkey: '5',
      action: () => audioEngine.triggerLaser(),
      color: 'from-pink-500/30 to-pink-600/10 border-pink-500/40 text-pink-300',
    },
    {
      id: 'subdrop',
      label: '💥 Sub Boom',
      sub: '808 Bass Drop',
      hotkey: '6',
      action: () => audioEngine.triggerSubDrop(),
      color: 'from-rose-500/30 to-rose-600/10 border-rose-500/40 text-rose-300',
    },
    {
      id: 'djdrop',
      label: '🎙️ DJ Drop',
      sub: 'Bambang Pro!',
      hotkey: '7',
      action: () => audioEngine.triggerDJDrop(),
      color: 'from-blue-500/30 to-blue-600/10 border-blue-500/40 text-blue-300',
    },
    {
      id: 'custom-extra',
      label: '🎛️ Custom',
      sub: 'Load Sample',
      hotkey: '8',
      action: () => {}, // empty action, relies on custom sample or upload dialog
      color: 'from-slate-700/40 to-slate-800/20 border-slate-500/40 text-slate-300',
    }
  ];

  return (
    <div className="bg-[#121620] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-2.5 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#232a38] pb-2">
        <div className="flex items-center gap-2">
          <Drum className="w-4 h-4 text-amber-400" />
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Live Soundboard & Stage FX
            </h2>
            <p className="text-[10px] text-slate-400">Instant Sample Triggers & Keyboard Hotkeys</p>
          </div>
        </div>
        <span className="text-[9px] font-mono text-slate-400">Keys [1 - 8]</span>
      </div>

      {/* Grid of Soundboard Pads */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {soundboardPads.map((pad) => {
          const hasCustom = !!customSamples[pad.id]?.buffer;
          
          return (
            <button
              key={pad.id}
              id={`btn-fx-${pad.id}`}
              onClick={(e) => {
                if (pad.id === 'custom-extra' && !hasCustom) {
                  openUploadDialog(e, pad.id);
                } else {
                  triggerFX(pad.id, pad.action);
                }
              }}
              className={`relative p-2.5 rounded-lg border bg-gradient-to-br transition-all flex flex-col items-start justify-between h-16 text-left select-none group active:scale-95 ${
                pad.color
              } ${
                activePad === pad.id
                  ? 'brightness-150 shadow-lg ring-2 ring-white/50 scale-95'
                  : 'hover:brightness-125'
              }`}
            >
              {/* Top row: Label & Hotkey badge */}
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-wide font-mono truncate mr-1">
                  {hasCustom ? customSamples[pad.id].name : pad.label}
                </span>
                <span className="bg-[#0b0e14]/80 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 text-slate-300 flex-shrink-0">
                  {pad.hotkey}
                </span>
              </div>

              {/* Sub description & Custom Actions */}
              <div className="w-full flex items-center justify-between mt-1">
                <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-300 truncate">
                  {hasCustom ? 'Custom Sample' : pad.sub}
                </span>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hasCustom ? (
                    <div
                      onClick={(e) => removeCustomSample(e, pad.id)}
                      className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 cursor-pointer"
                      title="Hapus Custom FX"
                    >
                      <X className="w-3 h-3" />
                    </div>
                  ) : (
                    <div
                      onClick={(e) => openUploadDialog(e, pad.id)}
                      className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 cursor-pointer"
                      title="Upload Custom FX"
                    >
                      <Upload className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
              
              {hasCustom && (
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)]"></div>
              )}
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleCustomUpload}
        className="hidden"
      />
    </div>
  );
};
