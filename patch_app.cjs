const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add State
const volStateTarget = `  const [musicVol, setMusicVol] = useState<number>(savedState?.musicVol ?? 0.75);
  const [fxVol, setFxVol] = useState<number>(savedState?.fxVol ?? 0.7);`;
const volStateReplacement = `  const [musicVol, setMusicVol] = useState<number>(savedState?.musicVol ?? 0.75);
  const [fxVol, setFxVol] = useState<number>(savedState?.fxVol ?? 0.7);
  const [soundboardVol, setSoundboardVol] = useState<number>(savedState?.soundboardVol ?? 0.9);`;
code = code.replace(volStateTarget, volStateReplacement);

const muteStateTarget = `  const [musicMuted, setMusicMuted] = useState<boolean>(savedState?.musicMuted ?? false);
  const [fxMuted, setFxMuted] = useState<boolean>(savedState?.fxMuted ?? false);`;
const muteStateReplacement = `  const [musicMuted, setMusicMuted] = useState<boolean>(savedState?.musicMuted ?? false);
  const [fxMuted, setFxMuted] = useState<boolean>(savedState?.fxMuted ?? false);
  const [soundboardMuted, setSoundboardMuted] = useState<boolean>(savedState?.soundboardMuted ?? false);`;
code = code.replace(muteStateTarget, muteStateReplacement);

// 2. Add to Auto-Save Effect
const saveDepsTarget = `      micVol, musicVol, fxVol, masterVol,
      micMuted, musicMuted, fxMuted,`;
const saveDepsReplacement = `      micVol, musicVol, fxVol, soundboardVol, masterVol,
      micMuted, musicMuted, fxMuted, soundboardMuted,`;
code = code.replace(saveDepsTarget, saveDepsReplacement);
code = code.replace(saveDepsTarget, saveDepsReplacement); // twice for the array dependencies

// 3. Audio Engine Init sync
const engineInitTarget = `      audioEngine.setMicVolume(micVol);
      audioEngine.setMusicVolume(musicVol);
      audioEngine.setFXVolume(fxVol);`;
const engineInitReplacement = `      audioEngine.setMicVolume(micVol);
      audioEngine.setMusicVolume(musicVol);
      audioEngine.setFXVolume(fxVol);
      audioEngine.setSoundboardVolume(soundboardVol);
      audioEngine.setSoundboardMute(soundboardMuted, soundboardVol);`;
code = code.replace(engineInitTarget, engineInitReplacement);

// 4. Handlers
const handleFxVolTarget = `  const handleFxVolChange = (val: number) => {
    setFxVol(val);
    audioEngine.setFXVolume(val);
  };`;
const handleFxVolReplacement = `  const handleFxVolChange = (val: number) => {
    setFxVol(val);
    audioEngine.setFXVolume(val);
  };

  const handleSoundboardVolChange = (val: number) => {
    setSoundboardVol(val);
    audioEngine.setSoundboardVolume(val);
  };`;
code = code.replace(handleFxVolTarget, handleFxVolReplacement);

const handleFxMuteTarget = `  const handleFxMuteToggle = () => {
    const next = !fxMuted;
    setFxMuted(next);
    audioEngine.setFXMute(next, fxVol);
  };`;
const handleFxMuteReplacement = `  const handleFxMuteToggle = () => {
    const next = !fxMuted;
    setFxMuted(next);
    audioEngine.setFXMute(next, fxVol);
  };

  const handleSoundboardMuteToggle = () => {
    const next = !soundboardMuted;
    setSoundboardMuted(next);
    audioEngine.setSoundboardMute(next, soundboardVol);
  };`;
code = code.replace(handleFxMuteTarget, handleFxMuteReplacement);

// 5. ChannelStrips Props
const channelStripsPropsTarget = `          <ChannelStrips
            micVol={micVol}
            musicVol={musicVol}
            fxVol={fxVol}
            micMuted={micMuted}
            musicMuted={musicMuted}
            fxMuted={fxMuted}`;
const channelStripsPropsReplacement = `          <ChannelStrips
            micVol={micVol}
            musicVol={musicVol}
            fxVol={fxVol}
            soundboardVol={soundboardVol}
            micMuted={micMuted}
            musicMuted={musicMuted}
            fxMuted={fxMuted}
            soundboardMuted={soundboardMuted}`;
code = code.replace(channelStripsPropsTarget, channelStripsPropsReplacement);

const channelStripsHandlersTarget = `            onMicVolChange={handleMicVolChange}
            onMusicVolChange={handleMusicVolChange}
            onFxVolChange={handleFxVolChange}
            onMicMuteToggle={handleMicMuteToggle}
            onMusicMuteToggle={handleMusicMuteToggle}
            onFxMuteToggle={handleFxMuteToggle}`;
const channelStripsHandlersReplacement = `            onMicVolChange={handleMicVolChange}
            onMusicVolChange={handleMusicVolChange}
            onFxVolChange={handleFxVolChange}
            onSoundboardVolChange={handleSoundboardVolChange}
            onMicMuteToggle={handleMicMuteToggle}
            onMusicMuteToggle={handleMusicMuteToggle}
            onFxMuteToggle={handleFxMuteToggle}
            onSoundboardMuteToggle={handleSoundboardMuteToggle}`;
code = code.replace(channelStripsHandlersTarget, channelStripsHandlersReplacement);

// Presets Modal updates (optional but good for consistency, though we don't strictly need it to change presets, it's better if it doesn't break)
const presetsApplyTarget = `    audioEngine.setMicVolume(preset.micVolume);
    audioEngine.setMusicVolume(preset.musicVolume);
    audioEngine.setFXVolume(preset.fxVolume);
    audioEngine.setMasterVolume(preset.masterVolume);`;
const presetsApplyReplacement = `    audioEngine.setMicVolume(preset.micVolume);
    audioEngine.setMusicVolume(preset.musicVolume);
    audioEngine.setFXVolume(preset.fxVolume);
    audioEngine.setSoundboardVolume(soundboardVol); // Keep soundboard vol same on preset change
    audioEngine.setMasterVolume(preset.masterVolume);`;
code = code.replace(presetsApplyTarget, presetsApplyReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Success App.tsx");
