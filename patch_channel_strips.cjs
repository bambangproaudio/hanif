const fs = require('fs');
let code = fs.readFileSync('src/components/ChannelStrips.tsx', 'utf8');

// 1. Update Props Interface
const propsTarget = `  musicVol: number;
  fxVol: number;
  micMuted: boolean;
  musicMuted: boolean;
  fxMuted: boolean;`;
const propsReplacement = `  musicVol: number;
  fxVol: number;
  soundboardVol: number;
  micMuted: boolean;
  musicMuted: boolean;
  fxMuted: boolean;
  soundboardMuted: boolean;`;
code = code.replace(propsTarget, propsReplacement);

const methodsTarget = `  onFxVolChange: (val: number) => void;
  onMicMuteToggle: () => void;
  onMusicMuteToggle: () => void;
  onFxMuteToggle: () => void;`;
const methodsReplacement = `  onFxVolChange: (val: number) => void;
  onSoundboardVolChange: (val: number) => void;
  onMicMuteToggle: () => void;
  onMusicMuteToggle: () => void;
  onFxMuteToggle: () => void;
  onSoundboardMuteToggle: () => void;`;
code = code.replace(methodsTarget, methodsReplacement);

// 2. Update Component Props signature
const compPropsTarget = `  fxVol,
  micMuted,
  musicMuted,
  fxMuted,`;
const compPropsReplacement = `  fxVol,
  soundboardVol,
  micMuted,
  musicMuted,
  fxMuted,
  soundboardMuted,`;
code = code.replace(compPropsTarget, compPropsReplacement);

const compMethodsTarget = `  onFxVolChange,
  onMicMuteToggle,
  onMusicMuteToggle,
  onFxMuteToggle,`;
const compMethodsReplacement = `  onFxVolChange,
  onSoundboardVolChange,
  onMicMuteToggle,
  onMusicMuteToggle,
  onFxMuteToggle,
  onSoundboardMuteToggle,`;
code = code.replace(compMethodsTarget, compMethodsReplacement);

// 3. Change Grid Columns
const gridTarget = `      {/* Horizontal Strip Deck */}
      <div className="grid grid-cols-3 gap-2.5">`;
const gridReplacement = `      {/* Horizontal Strip Deck */}
      <div className="grid grid-cols-4 gap-2.5">`;
code = code.replace(gridTarget, gridReplacement);

// 4. Add the Soundboard Strip. We'll insert it before FX RETURN strip
const fxReturnTarget = `        {/* STRIP 3: FX RETURN */}`;
const soundboardStrip = `        {/* STRIP 3: SOUNDBOARD */}
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
            className={\`w-full py-1.5 rounded text-[11px] font-mono font-bold uppercase transition-all border \${
              soundboardMuted
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-[#1e2533] text-slate-300 border-[#323d52] hover:bg-[#283244] hover:text-white'
            }\`}
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

        {/* STRIP 4: FX RETURN */}`;
code = code.replace(fxReturnTarget, soundboardStrip);
code = code.replace(`CH 3: FX RETURN`, `CH 4: FX RETURN`);

fs.writeFileSync('src/components/ChannelStrips.tsx', code);
console.log("Success ChannelStrips");
