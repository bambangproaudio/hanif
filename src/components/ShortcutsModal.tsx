import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1', action: 'Trigger Soundboard FX: 😂 Ketawa (Laugh)' },
    { key: '2', action: 'Trigger Soundboard FX: 👏 Applause (Tepuk Tangan)' },
    { key: '3', action: 'Trigger Soundboard FX: 📢 Air Horn (Terompet DJ)' },
    { key: '4', action: 'Trigger Soundboard FX: 🥁 Rimshot (Ba-Dum-Tss)' },
    { key: '5', action: 'Trigger Soundboard FX: 🔫 Laser Beam FX' },
    { key: '6', action: 'Trigger Soundboard FX: 💥 Sub-Bass 808 Drop' },
    { key: '7', action: 'Trigger Soundboard FX: 🎙️ DJ Drop Bambang Pro' },
    { key: 'Scroll Wheel', action: 'Scroll on any Knob or Fader to increment/decrement' },
    { key: 'Double Click', action: 'Double click any Knob or Fader to reset to 0dB default' },
    { key: 'Shift + Drag', action: 'Hold Shift while dragging Knobs for ultra-fine micro adjustment' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151922] border border-[#2b3547] rounded-xl max-w-md w-full p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#252d3d] pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono uppercase text-slate-100">
              Keyboard Shortcuts & Hardware Gestures
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#202735]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="bg-[#0e1219] p-2.5 rounded-lg border border-[#202735] flex items-center justify-between gap-3 text-xs font-mono"
            >
              <span className="text-slate-300">{sc.action}</span>
              <kbd className="bg-[#1b2332] text-cyan-300 border border-cyan-500/40 px-2 py-1 rounded font-bold whitespace-nowrap shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#252d3d]">
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-all"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};
