import React, { useState, useEffect } from 'react';
import {
  VocalEQSettings,
  MusicEQSettings,
  FXSettings,
  DynamicsSettings,
  VoiceFXPreset,
  MixerPreset,
} from './types';
import { audioEngine } from './audio/audioEngine';
import { Header } from './components/Header';
import { YouTubeKaraokePanel } from './components/YouTubeKaraokePanel';
import { BackingTrackPlayer } from './components/BackingTrackPlayer';
import { VisualizerPanel } from './components/VisualizerPanel';
import { VocalDSPPanel } from './components/VocalDSPPanel';
import { FXRackPanel } from './components/FXRackPanel';
import { SoundboardPanel } from './components/SoundboardPanel';
import { ChannelStrips } from './components/ChannelStrips';
import { MasterSection } from './components/MasterSection';
import { PresetsModal } from './components/PresetsModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { FACTORY_PRESETS } from './data/factoryPresets';

export default function App() {
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);

  // Modals
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Session State Auto-Save Loading
  const savedState = (() => {
    try {
      const saved = localStorage.getItem('BambangMixerSessionState');
      if (saved) return JSON.parse(saved);
    } catch { }
    return null;
  })();

  // Active Channel & DSP States
  const [vocalEQ, setVocalEQ] = useState<VocalEQSettings>(savedState?.vocalEQ || FACTORY_PRESETS[0].vocalEQ);
  const [musicEQ, setMusicEQ] = useState<MusicEQSettings>(savedState?.musicEQ || FACTORY_PRESETS[0].musicEQ);
  const [fx, setFX] = useState<FXSettings>(savedState?.fx || FACTORY_PRESETS[0].fx);
  const [dynamics, setDynamics] = useState<DynamicsSettings>(savedState?.dynamics || FACTORY_PRESETS[0].dynamics);
  const [voiceFX, setVoiceFX] = useState<VoiceFXPreset>(savedState?.voiceFX || 'normal');

  // Volumes & Mute States
  const [micVol, setMicVol] = useState<number>(savedState?.micVol ?? 0.85);
  const [musicVol, setMusicVol] = useState<number>(savedState?.musicVol ?? 0.75);
  const [fxVol, setFxVol] = useState<number>(savedState?.fxVol ?? 0.7);
  const [soundboardVol, setSoundboardVol] = useState<number>(savedState?.soundboardVol ?? 0.9);
  const [masterVol, setMasterVol] = useState<number>(savedState?.masterVol ?? 0.85);

  const [micMuted, setMicMuted] = useState<boolean>(savedState?.micMuted ?? false);
  const [musicMuted, setMusicMuted] = useState<boolean>(savedState?.musicMuted ?? false);
  const [fxMuted, setFxMuted] = useState<boolean>(savedState?.fxMuted ?? false);
  const [soundboardMuted, setSoundboardMuted] = useState<boolean>(savedState?.soundboardMuted ?? false);

  const [micPan, setMicPan] = useState<number>(savedState?.micPan ?? 0);
  const [musicPan, setMusicPan] = useState<number>(savedState?.musicPan ?? 0);
  const [micPreamp, setMicPreamp] = useState<number>(savedState?.micPreamp ?? 1.0);
  const [micRevSend, setMicRevSend] = useState<number>(savedState?.micRevSend ?? 0.35);
  const [micDelaySend, setMicDelaySend] = useState<number>(savedState?.micDelaySend ?? 0.25);
  const [musicRevSend, setMusicRevSend] = useState<number>(savedState?.musicRevSend ?? 0.05);

  // Auto-Save Effect
  useEffect(() => {
    const stateToSave = {
      vocalEQ, musicEQ, fx, dynamics, voiceFX,
      micVol, musicVol, fxVol, soundboardVol, masterVol,
      micMuted, musicMuted, fxMuted, soundboardMuted,
      micPan, musicPan, micPreamp, micRevSend, micDelaySend, musicRevSend
    };
    localStorage.setItem('BambangMixerSessionState', JSON.stringify(stateToSave));
  }, [
    vocalEQ, musicEQ, fx, dynamics, voiceFX,
    micVol, musicVol, fxVol, masterVol,
    micMuted, musicMuted, fxMuted,
    micPan, musicPan, micPreamp, micRevSend, micDelaySend, musicRevSend
  ]);

  // Initialize Web Audio Engine
  const handleConnectAudio = async () => {
    const success = await audioEngine.initAudio();
    if (success) {
      setIsEngineRunning(true);
      // Synchronize initial state to Web Audio Nodes
      audioEngine.setMasterVolume(masterVol);
      audioEngine.setMicVolume(micVol);
      audioEngine.setMusicVolume(musicVol);
      audioEngine.setFXVolume(fxVol);
      audioEngine.setSoundboardVolume(soundboardVol);
      audioEngine.setSoundboardMute(soundboardMuted, soundboardVol);
      audioEngine.setMicPreamp(micPreamp);
      audioEngine.setMicPan(micPan);
      audioEngine.setMusicPan(musicPan);
      audioEngine.setMicReverbSend(micRevSend);
      audioEngine.setMicDelaySend(micDelaySend);
      audioEngine.setMusicReverbSend(musicRevSend);
      audioEngine.setVocalEQ(vocalEQ);
      audioEngine.setMusicEQ(musicEQ);
      audioEngine.setFXSettings(fx);
      audioEngine.setDynamics(dynamics);
      audioEngine.setVoiceFX(voiceFX);
    }
  };

  // Channel Volume Handlers
  const handleMicVolChange = (val: number) => {
    setMicVol(val);
    audioEngine.setMicVolume(val);
  };

  const handleMusicVolChange = (val: number) => {
    setMusicVol(val);
    audioEngine.setMusicVolume(val);
  };

  const handleFxVolChange = (val: number) => {
    setFxVol(val);
    audioEngine.setFXVolume(val);
  };

  const handleSoundboardVolChange = (val: number) => {
    setSoundboardVol(val);
    audioEngine.setSoundboardVolume(val);
  };

  const handleMasterVolChange = (val: number) => {
    setMasterVol(val);
    audioEngine.setMasterVolume(val);
  };

  // Mute Toggles
  const handleMicMuteToggle = () => {
    const next = !micMuted;
    setMicMuted(next);
    audioEngine.setMicMute(next, micVol);
  };

  const handleMusicMuteToggle = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    audioEngine.setMusicMute(next, musicVol);
  };

  const handleFxMuteToggle = () => {
    const next = !fxMuted;
    setFxMuted(next);
    audioEngine.setFXMute(next, fxVol);
  };

  const handleSoundboardMuteToggle = () => {
    const next = !soundboardMuted;
    setSoundboardMuted(next);
    audioEngine.setSoundboardMute(next, soundboardVol);
  };

  // Pan & Send Handlers
  const handleMicPanChange = (val: number) => {
    setMicPan(val);
    audioEngine.setMicPan(val);
  };

  const handleMusicPanChange = (val: number) => {
    setMusicPan(val);
    audioEngine.setMusicPan(val);
  };

  const handleMicPreampChange = (val: number) => {
    setMicPreamp(val);
    audioEngine.setMicPreamp(val);
  };

  const handleMicRevSendChange = (val: number) => {
    setMicRevSend(val);
    audioEngine.setMicReverbSend(val);
  };

  const handleMicDelaySendChange = (val: number) => {
    setMicDelaySend(val);
    audioEngine.setMicDelaySend(val);
  };

  const handleMusicRevSendChange = (val: number) => {
    setMusicRevSend(val);
    audioEngine.setMusicReverbSend(val);
  };

  // Apply a selected preset
  const handleApplyPreset = (preset: MixerPreset) => {
    setVocalEQ(preset.vocalEQ);
    setMusicEQ(preset.musicEQ);
    setFX(preset.fx);
    setDynamics(preset.dynamics);
    setVoiceFX(preset.voiceFX);
    setMicVol(preset.micVolume);
    setMusicVol(preset.musicVolume);
    setFxVol(preset.fxVolume);
    setMasterVol(preset.masterVolume);

    audioEngine.setVocalEQ(preset.vocalEQ);
    audioEngine.setMusicEQ(preset.musicEQ);
    audioEngine.setFXSettings(preset.fx);
    audioEngine.setDynamics(preset.dynamics);
    audioEngine.setVoiceFX(preset.voiceFX);
    audioEngine.setMicVolume(preset.micVolume);
    audioEngine.setMusicVolume(preset.musicVolume);
    audioEngine.setFXVolume(preset.fxVolume);
    audioEngine.setSoundboardVolume(soundboardVol); // Keep soundboard vol same on preset change
    audioEngine.setMasterVolume(preset.masterVolume);
    audioEngine.updateReverbType(preset.fx.reverbType, preset.fx.reverbDecay, preset.fx.reverbDamp);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1017] text-[#f0f3f8] overflow-hidden select-none font-sans">
      {/* Top Header */}
      <Header
        isEngineRunning={isEngineRunning}
        onConnectAudio={handleConnectAudio}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Multi-Panel Workstation */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 p-2.5 overflow-hidden min-h-0">
        {/* LEFT COLUMN: YouTube Karaoke Engine & Audio Backing Tracks (4 Cols) */}
        <section className="lg:col-span-4 flex flex-col gap-2.5 overflow-y-auto pr-1">
          <YouTubeKaraokePanel
            musicEQ={musicEQ}
            onMusicEQChange={(newEQ) => {
              setMusicEQ(newEQ);
              audioEngine.setMusicEQ(newEQ);
            }}
          />
          <BackingTrackPlayer />
        </section>

        {/* CENTER COLUMN: Spectrum Analyzer, Vocal DSP, FX Rack, Soundboard (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-2.5 overflow-y-auto pr-1">
          <VisualizerPanel
            vocalEQ={vocalEQ}
            onVocalEQChange={(newEQ) => {
              setVocalEQ(newEQ);
              audioEngine.setVocalEQ(newEQ);
            }}
          />
          <VocalDSPPanel
            vocalEQ={vocalEQ}
            onVocalEQChange={(newEQ) => {
              setVocalEQ(newEQ);
              audioEngine.setVocalEQ(newEQ);
            }}
            voiceFX={voiceFX}
            onVoiceFXChange={(newFX) => {
              setVoiceFX(newFX);
              audioEngine.setVoiceFX(newFX);
            }}
            dynamics={dynamics}
            onDynamicsChange={(newDyn) => {
              setDynamics(newDyn);
              audioEngine.setDynamics(newDyn);
            }}
          />
          <FXRackPanel
            fx={fx}
            onFXChange={(newFX) => {
              setFX(newFX);
              audioEngine.setFXSettings(newFX);
            }}
          />
          <SoundboardPanel />
        </section>

        {/* RIGHT COLUMN: Channel Strips, Matrix Bus & Master Section (3 Cols) */}
        <section className="lg:col-span-3 flex flex-col gap-2.5 overflow-y-auto pr-1">
          <ChannelStrips
            micVol={micVol}
            musicVol={musicVol}
            fxVol={fxVol}
            soundboardVol={soundboardVol}
            micMuted={micMuted}
            musicMuted={musicMuted}
            fxMuted={fxMuted}
            soundboardMuted={soundboardMuted}
            micPan={micPan}
            musicPan={musicPan}
            micPreamp={micPreamp}
            micRevSend={micRevSend}
            micDelaySend={micDelaySend}
            musicRevSend={musicRevSend}
            onMicVolChange={handleMicVolChange}
            onMusicVolChange={handleMusicVolChange}
            onFxVolChange={handleFxVolChange}
            onSoundboardVolChange={handleSoundboardVolChange}
            onMicMuteToggle={handleMicMuteToggle}
            onMusicMuteToggle={handleMusicMuteToggle}
            onFxMuteToggle={handleFxMuteToggle}
            onSoundboardMuteToggle={handleSoundboardMuteToggle}
            onMicPanChange={handleMicPanChange}
            onMusicPanChange={handleMusicPanChange}
            onMicPreampChange={handleMicPreampChange}
            onMicRevSendChange={handleMicRevSendChange}
            onMicDelaySendChange={handleMicDelaySendChange}
            onMusicRevSendChange={handleMusicRevSendChange}
          />
          <MasterSection
            masterVol={masterVol}
            onMasterVolChange={handleMasterVolChange}
          />
        </section>
      </main>

      {/* Modals */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onApplyPreset={handleApplyPreset}
        currentVocalEQ={vocalEQ}
        currentMusicEQ={musicEQ}
        currentFX={fx}
        currentDynamics={dynamics}
        currentVoiceFX={voiceFX}
        currentMicVol={micVol}
        currentMusicVol={musicVol}
        currentFxVol={fxVol}
        currentMasterVol={masterVol}
      />

      <AudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
