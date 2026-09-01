import React, { useRef, useEffect, useState, useCallback } from 'react';
import { VisualizerMode, VocalEQSettings } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { Activity, BarChart3, Disc, Radio, Waves } from 'lucide-react';

interface VisualizerPanelProps {
  vocalEQ: VocalEQSettings;
  onVocalEQChange: (newEQ: VocalEQSettings) => void;
}

export const VisualizerPanel: React.FC<VisualizerPanelProps> = ({
  vocalEQ,
  onVocalEQChange,
}) => {
  const [mode, setMode] = useState<VisualizerMode>('spectrum');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [peakFreq, setPeakFreq] = useState<number>(0);
  const [rmsDb, setRmsDb] = useState<string>('-∞');

  // Interactive EQ handles definition
  const eqBands = [
    { id: 'sub', name: 'Sub', freq: 60, gain: vocalEQ.sub, color: '#38bdf8' },
    { id: 'bass', name: 'Bass', freq: 250, gain: vocalEQ.bass, color: '#34d399' },
    { id: 'mid', name: 'Mid HQ', freq: 1500, gain: vocalEQ.mid, color: '#fbbf24' },
    { id: 'high', name: 'High', freq: 4000, gain: vocalEQ.high, color: '#fb7185' },
    { id: 'treble', name: 'Treble', freq: 10000, gain: vocalEQ.treble, color: '#c084fc' },
  ];

  // Frequency to X coordinate (Logarithmic scale 20Hz - 20kHz)
  const freqToX = (freq: number, width: number) => {
    const minF = Math.log10(20);
    const maxF = Math.log10(20000);
    const curF = Math.log10(Math.max(20, Math.min(20000, freq)));
    return ((curF - minF) / (maxF - minF)) * width;
  };

  // Gain to Y coordinate (-18dB to +18dB)
  const gainToY = (gain: number, height: number) => {
    const minG = -18;
    const maxG = 18;
    const norm = (gain - minG) / (maxG - minG);
    return (1 - norm) * (height - 20) + 10;
  };

  const yToGain = (y: number, height: number) => {
    const norm = 1 - (y - 10) / (height - 20);
    const raw = -18 + norm * 36;
    return Math.max(-18, Math.min(18, Number(raw.toFixed(1))));
  };

  // Canvas visual rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let waterfallHistory: Uint8Array[] = [];

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid Lines & Frequency markers
      drawGrid(ctx, w, h);

      const analyser = audioEngine.masterAnalyser;

      if (!analyser || !audioEngine.isRunning) {
        // Standby animated idle line
        drawIdleState(ctx, w, h);
        return;
      }

      const bufferLen = analyser.frequencyBinCount;
      const freqData = new Uint8Array(bufferLen);
      const timeData = new Uint8Array(bufferLen);
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      // Calculate peak frequency & RMS
      let maxVal = 0;
      let maxIdx = 0;
      let sumSq = 0;

      for (let i = 0; i < bufferLen; i++) {
        if (freqData[i] > maxVal) {
          maxVal = freqData[i];
          maxIdx = i;
        }
        const v = (timeData[i] - 128) / 128;
        sumSq += v * v;
      }

      const nyquist = (audioEngine.ctx?.sampleRate || 48000) / 2;
      const detectedFreq = Math.round((maxIdx / bufferLen) * nyquist);
      if (maxVal > 20) setPeakFreq(detectedFreq);

      const rms = Math.sqrt(sumSq / bufferLen);
      if (rms > 0.001) {
        const db = 20 * Math.log10(rms);
        setRmsDb(`${db.toFixed(1)} dB`);
      } else {
        setRmsDb('-∞');
      }

      // Render according to selected mode
      if (mode === 'spectrum') {
        drawSpectrumBars(ctx, w, h, freqData, bufferLen);
      } else if (mode === 'eq-curve') {
        drawEQResponse(ctx, w, h, freqData, bufferLen);
      } else if (mode === 'oscilloscope') {
        drawOscilloscope(ctx, w, h, timeData, bufferLen);
      } else if (mode === 'circular') {
        drawCircularVisualizer(ctx, w, h, freqData, bufferLen);
      } else if (mode === 'waterfall') {
        waterfallHistory.unshift(new Uint8Array(freqData));
        if (waterfallHistory.length > 50) waterfallHistory.pop();
        drawWaterfall(ctx, w, h, waterfallHistory);
      }
    };

    const drawGrid = (c: CanvasRenderingContext2D, width: number, height: number) => {
      c.strokeStyle = '#18202e';
      c.lineWidth = 1;

      // Horizontal Gain Grid (-12, -6, 0, +6, +12 dB)
      [-12, -6, 0, 6, 12].forEach(db => {
        const y = gainToY(db, height);
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(width, y);
        c.stroke();

        c.fillStyle = db === 0 ? '#475569' : '#334155';
        c.font = '9px JetBrains Mono';
        c.fillText(`${db > 0 ? '+' : ''}${db}dB`, 6, y - 3);
      });

      // Vertical Frequency Grid (50, 100, 250, 500, 1k, 2k, 5k, 10k, 20k)
      const freqs = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000];
      freqs.forEach(f => {
        const x = freqToX(f, width);
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, height);
        c.stroke();

        c.fillStyle = '#334155';
        c.font = '9px JetBrains Mono';
        const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
        c.fillText(label, x + 2, height - 6);
      });
    };

    const drawIdleState = (c: CanvasRenderingContext2D, width: number, height: number) => {
      c.strokeStyle = '#00e5ff33';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, height / 2);
      c.lineTo(width, height / 2);
      c.stroke();

      c.fillStyle = '#64748b';
      c.font = '12px Outfit, sans-serif';
      c.textAlign = 'center';
      c.fillText('DSP ENGINE READY • CONNECT AUDIO ENGINE TO STREAM REAL-TIME FFT', width / 2, height / 2 - 10);
      c.textAlign = 'left';
    };

    const drawSpectrumBars = (
      c: CanvasRenderingContext2D,
      width: number,
      height: number,
      data: Uint8Array,
      len: number
    ) => {
      const numBars = 64;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        // Group bins logarithmically
        const binIndex = Math.floor(Math.pow(i / numBars, 1.8) * (len * 0.7));
        const val = data[binIndex] || 0;
        const barHeight = (val / 255) * (height - 24);
        const x = i * (barWidth + 2);
        const y = height - barHeight - 18;

        // Gradient Bar
        const grad = c.createLinearGradient(0, height - 18, 0, y);
        grad.addColorStop(0, '#00ff88');
        grad.addColorStop(0.65, '#00e5ff');
        grad.addColorStop(0.88, '#ffb703');
        grad.addColorStop(1, '#ff3366');

        c.fillStyle = grad;
        c.fillRect(x, y, barWidth, barHeight);

        // Peak cap
        c.fillStyle = '#ffffff';
        c.fillRect(x, y - 2, barWidth, 2);
      }
    };

    const drawEQResponse = (
      c: CanvasRenderingContext2D,
      width: number,
      height: number,
      data: Uint8Array,
      len: number
    ) => {
      // Draw background FFT spectrum curve with glow
      c.beginPath();
      c.moveTo(0, height);
      for (let i = 0; i < width; i += 3) {
        const minF = Math.log10(20);
        const maxF = Math.log10(20000);
        const f = Math.pow(10, minF + (i / width) * (maxF - minF));
        const bin = Math.min(len - 1, Math.floor((f / 24000) * len));
        const val = data[bin] || 0;
        const y = height - 20 - (val / 255) * (height - 40);
        c.lineTo(i, y);
      }
      c.lineTo(width, height);
      const bgGrad = c.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
      bgGrad.addColorStop(1, 'rgba(0, 229, 255, 0.01)');
      c.fillStyle = bgGrad;
      c.fill();

      // Draw Master EQ Combined Curve
      c.beginPath();
      c.strokeStyle = '#00e5ff';
      c.lineWidth = 2.5;
      c.shadowColor = '#00e5ff';
      c.shadowBlur = 8;

      for (let x = 0; x <= width; x += 4) {
        const minF = Math.log10(20);
        const maxF = Math.log10(20000);
        const f = Math.pow(10, minF + (x / width) * (maxF - minF));

        // Calculate combined gain at frequency f from the 5 bands
        let totalGain = 0;
        eqBands.forEach(band => {
          const octDiff = Math.log2(f / band.freq);
          // Bell curve / shelf response approximation
          const response = band.gain / (1 + Math.pow(octDiff * 1.6, 2));
          totalGain += response;
        });

        // High-pass filter roll off if low-cut enabled
        if (vocalEQ.lowCut && f < 80) {
          const hpAtten = 12 * Math.log2(80 / f);
          totalGain -= hpAtten;
        }

        const y = gainToY(totalGain, height);
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.shadowBlur = 0;

      // Draw Interactive EQ Node Handles
      eqBands.forEach(band => {
        const nodeX = freqToX(band.freq, width);
        const nodeY = gainToY(band.gain, height);

        // Outer ring
        c.fillStyle = band.color;
        c.shadowColor = band.color;
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(nodeX, nodeY, 7, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;

        c.fillStyle = '#0a0d14';
        c.beginPath();
        c.arc(nodeX, nodeY, 3.5, 0, Math.PI * 2);
        c.fill();

        // Node Label
        c.fillStyle = band.color;
        c.font = 'bold 9px JetBrains Mono';
        c.fillText(`${band.name} (${band.gain > 0 ? '+' : ''}${band.gain}dB)`, nodeX - 18, nodeY - 12);
      });
    };

    const drawOscilloscope = (
      c: CanvasRenderingContext2D,
      width: number,
      height: number,
      data: Uint8Array,
      len: number
    ) => {
      c.strokeStyle = '#00ff88';
      c.lineWidth = 2;
      c.shadowColor = '#00ff88';
      c.shadowBlur = 6;
      c.beginPath();

      const sliceWidth = width / len;
      let x = 0;

      for (let i = 0; i < len; i++) {
        const v = data[i] / 128.0;
        const y = (v * (height - 30)) / 2 + 15;

        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);

        x += sliceWidth;
      }
      c.lineTo(width, height / 2);
      c.stroke();
      c.shadowBlur = 0;
    };

    const drawCircularVisualizer = (
      c: CanvasRenderingContext2D,
      width: number,
      height: number,
      data: Uint8Array,
      len: number
    ) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.28;
      const numPoints = 80;

      c.beginPath();
      c.strokeStyle = '#00e5ff';
      c.lineWidth = 2;
      c.shadowColor = '#00e5ff';
      c.shadowBlur = 8;

      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const bin = Math.floor((i / numPoints) * (len * 0.5));
        const val = (data[bin] || 0) / 255;
        const r = radius + val * 45;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.stroke();
      c.shadowBlur = 0;

      // Center glowing core
      c.fillStyle = 'rgba(0, 229, 255, 0.15)';
      c.beginPath();
      c.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
      c.fill();
    };

    const drawWaterfall = (
      c: CanvasRenderingContext2D,
      width: number,
      height: number,
      history: Uint8Array[]
    ) => {
      const rows = history.length;
      if (rows === 0) return;
      const rowHeight = height / rows;

      history.forEach((row, rIdx) => {
        const y = rIdx * rowHeight;
        const numCols = 60;
        const colW = width / numCols;

        for (let col = 0; col < numCols; col++) {
          const bin = Math.floor(Math.pow(col / numCols, 1.6) * (row.length * 0.6));
          const val = (row[bin] || 0) / 255;
          const hue = 180 + val * 120;
          c.fillStyle = `hsla(${hue}, 100%, ${val * 60}%, ${1 - rIdx / rows})`;
          c.fillRect(col * colW, y, colW, rowHeight);
        }
      });
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [mode, vocalEQ, eqBands]);

  // Handle interactive dragging on EQ Curve Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'eq-curve') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check hit on any of the 5 EQ nodes
    for (const band of eqBands) {
      const nodeX = freqToX(band.freq, canvas.width);
      const nodeY = gainToY(band.gain, canvas.height);
      const dist = Math.hypot(x - nodeX, y - nodeY);
      if (dist < 22) {
        setDraggedNode(band.id);
        return;
      }
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNode || mode !== 'eq-curve') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const newGain = yToGain(y, canvas.height);

    const updated = { ...vocalEQ, [draggedNode]: newGain };
    onVocalEQChange(updated);
    audioEngine.setVocalEQ(updated);
  }, [draggedNode, mode, vocalEQ, onVocalEQChange]);

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  return (
    <div className="bg-[#12161f] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-2.5 shadow-xl">
      {/* Top Header & Visualizer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#232a38] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            Master DSP Spectrum & RTA Analyzer
          </span>
        </div>

        {/* Real-time telemetry badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="bg-[#0b0e14] px-2 py-0.5 rounded border border-[#232a38] text-slate-300">
            Peak: <strong className="text-emerald-400">{peakFreq > 0 ? `${peakFreq} Hz` : '--'}</strong>
          </div>
          <div className="bg-[#0b0e14] px-2 py-0.5 rounded border border-[#232a38] text-slate-300">
            Master RMS: <strong className="text-cyan-400">{rmsDb}</strong>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-md border border-[#232a38]">
          <button
            id="btn-vis-spectrum"
            onClick={() => setMode('spectrum')}
            title="FFT Spectrum Bars"
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              mode === 'spectrum'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Bars
          </button>
          <button
            id="btn-vis-eq"
            onClick={() => setMode('eq-curve')}
            title="Interactive Parametric EQ Response"
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              mode === 'eq-curve'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Interactive EQ
          </button>
          <button
            id="btn-vis-wave"
            onClick={() => setMode('oscilloscope')}
            title="Oscilloscope Waveform"
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              mode === 'oscilloscope'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            Wave
          </button>
          <button
            id="btn-vis-circ"
            onClick={() => setMode('circular')}
            title="Circular Radial Analyzer"
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              mode === 'circular'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            Radial
          </button>
          <button
            id="btn-vis-waterfall"
            onClick={() => setMode('waterfall')}
            title="Spectrogram Waterfall"
            className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              mode === 'waterfall'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Waterfall
          </button>
        </div>
      </div>

      {/* Main Canvas Display */}
      <div className="relative w-full h-[190px] bg-[#090c12] rounded-md border border-[#202735] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={720}
          height={190}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full block ${mode === 'eq-curve' ? 'cursor-ns-resize' : ''}`}
        />

        {mode === 'eq-curve' && (
          <div className="absolute top-2 right-2 pointer-events-none bg-slate-900/80 px-2 py-1 rounded text-[10px] font-mono text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
            Drag glowing nodes on curve to tweak Vocal EQ
          </div>
        )}
      </div>
    </div>
  );
};
