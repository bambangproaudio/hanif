const fs = require('fs');
let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

const target = `  private setupSoundboardBus() {
    if (!this.ctx || !this.masterGain || !this.reverbPreDelay || !this.delayNode) return;

    this.soundboardGain = this.ctx.createGain();
    this.soundboardGain.gain.value = 0.9;

    this.soundboardGain.connect(this.masterGain);
  }`;

const replacement = `  private setupSoundboardBus() {
    if (!this.ctx || !this.masterGain) return;

    this.soundboardGain = this.ctx.createGain();
    this.soundboardGain.gain.value = 0.9;
    
    this.soundboardAnalyser = this.ctx.createAnalyser();
    this.soundboardAnalyser.fftSize = 256;

    this.soundboardGain.connect(this.soundboardAnalyser);
    this.soundboardAnalyser.connect(this.masterGain);
  }`;

if (code.includes(target)) {
  fs.writeFileSync('src/audio/audioEngine.ts', code.replace(target, replacement));
  console.log("Success");
} else {
  console.log("Target not found");
}
