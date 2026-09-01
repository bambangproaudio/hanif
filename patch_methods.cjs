const fs = require('fs');
let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

const target = `  public setMicVolume(val: number) {`;
const replacement = `  public setSoundboardVolume(val: number) {
    if (this.soundboardGain && this.ctx) {
      this.soundboardGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  public setSoundboardMute(isMuted: boolean, previousVol: number) {
    if (this.soundboardGain && this.ctx) {
      const targetVol = isMuted ? 0 : previousVol;
      this.soundboardGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.05);
    }
  }

  public setMicVolume(val: number) {`;

if (code.includes(target)) {
  fs.writeFileSync('src/audio/audioEngine.ts', code.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Target not found");
}
