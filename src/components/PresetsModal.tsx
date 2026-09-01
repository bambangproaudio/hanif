import React, { useState } from 'react';
import { MixerPreset, VocalEQSettings, MusicEQSettings, FXSettings, DynamicsSettings, VoiceFXPreset } from '../types';
import { FACTORY_PRESETS } from '../data/factoryPresets';
import { Download, FolderOpen, Plus, Save, Sparkles, Trash2, Upload, X } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: MixerPreset) => void;
  currentVocalEQ: VocalEQSettings;
  currentMusicEQ: MusicEQSettings;
  currentFX: FXSettings;
  currentDynamics: DynamicsSettings;
  currentVoiceFX: VoiceFXPreset;
  currentMicVol: number;
  currentMusicVol: number;
  currentFxVol: number;
  currentMasterVol: number;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
  currentVocalEQ,
  currentMusicEQ,
  currentFX,
  currentDynamics,
  currentVoiceFX,
  currentMicVol,
  currentMusicVol,
  currentFxVol,
  currentMasterVol,
}) => {
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [userPresets, setUserPresets] = useState<MixerPreset[]>(() => {
    try {
      const saved = localStorage.getItem('BambangMixerUserPresets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  const handleSaveCurrentPreset = () => {
    if (!newPresetName.trim()) {
      alert('Masukkan nama preset terlebih dahulu!');
      return;
    }

    const newPreset: MixerPreset = {
      id: `user-${Date.now()}`,
      name: newPresetName.trim(),
      description: 'Preset kustom tersimpan pengguna',
      category: 'custom',
      vocalEQ: currentVocalEQ,
      musicEQ: currentMusicEQ,
      fx: currentFX,
      dynamics: currentDynamics,
      voiceFX: currentVoiceFX,
      micVolume: currentMicVol,
      musicVolume: currentMusicVol,
      fxVolume: currentFxVol,
      masterVolume: currentMasterVol,
    };

    const updated = [newPreset, ...userPresets];
    setUserPresets(updated);
    localStorage.setItem('BambangMixerUserPresets', JSON.stringify(updated));
    setNewPresetName('');
    alert(`Preset "${newPreset.name}" Berhasil Disimpan!`);
  };

  const handleDeleteUserPreset = (id: string) => {
    const updated = userPresets.filter(p => p.id !== id);
    setUserPresets(updated);
    localStorage.setItem('BambangMixerUserPresets', JSON.stringify(updated));
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userPresets, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `bambang_mixer_presets_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const combined = [...imported, ...userPresets];
          setUserPresets(combined);
          localStorage.setItem('BambangMixerUserPresets', JSON.stringify(combined));
          alert(`Berhasil mengimpor ${imported.length} preset!`);
        }
      } catch (err) {
        alert('File JSON tidak valid: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151922] border border-[#2b3547] rounded-xl max-w-2xl w-full p-5 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#252d3d] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold font-mono uppercase text-slate-100">
                Preset Manager & Memory Banks
              </h2>
              <p className="text-xs text-slate-400">Save, Load, Export & Import Mixer DSP Configurations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#202735]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current State Input */}
        <div className="bg-[#0e1219] p-3 rounded-lg border border-[#202735] flex items-center gap-2">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Nama Preset Baru (contoh: Dangdut Koplo Vokal Tajam)..."
            className="flex-1 bg-[#151922] border border-[#293243] rounded-md px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            id="btn-save-current-preset"
            onClick={handleSaveCurrentPreset}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-1.5 rounded-md text-xs font-mono font-extrabold uppercase flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Preset
          </button>
        </div>

        {/* Presets List Scrollable Area */}
        <div className="overflow-y-auto flex-1 flex flex-col gap-3 pr-1">
          {/* Factory Presets */}
          <div>
            <span className="text-[11px] font-mono font-bold uppercase text-cyan-400 mb-2 block">
              ★ Factory Presets (Pro Calibrated):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FACTORY_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-[#0f131c] border border-[#232b3b] hover:border-cyan-500/50 p-2.5 rounded-lg flex flex-col justify-between gap-1.5 transition-all group"
                >
                  <div>
                    <div className="text-xs font-bold font-mono text-slate-200 group-hover:text-cyan-300">
                      {preset.name}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1a202c]">
                    <span className="text-[9px] font-mono text-amber-400 uppercase">
                      Category: {preset.category}
                    </span>
                    <button
                      onClick={() => {
                        onApplyPreset(preset);
                        onClose();
                      }}
                      className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all"
                    >
                      Load Preset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Saved Presets */}
          {userPresets.length > 0 && (
            <div className="mt-2">
              <span className="text-[11px] font-mono font-bold uppercase text-emerald-400 mb-2 block">
                💾 User Saved Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="bg-[#0f131c] border border-[#232b3b] hover:border-emerald-500/50 p-2.5 rounded-lg flex flex-col justify-between gap-1.5 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold font-mono text-emerald-300">
                        {preset.name}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#1a202c]">
                      <button
                        onClick={() => handleDeleteUserPreset(preset.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10"
                        title="Hapus Preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onApplyPreset(preset);
                          onClose();
                        }}
                        className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all"
                      >
                        Load Preset
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Backup & Restore Bar */}
        <div className="flex items-center justify-between border-t border-[#252d3d] pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="bg-[#1a212e] hover:bg-[#252f42] text-slate-300 border border-[#2f3a4e] px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export JSON
            </button>
            <label className="bg-[#1a212e] hover:bg-[#252f42] text-slate-300 border border-[#2f3a4e] px-3 py-1.5 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={onClose}
            className="bg-[#1f2735] hover:bg-[#2c374a] text-slate-200 px-4 py-1.5 rounded-md text-xs font-mono font-bold transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
