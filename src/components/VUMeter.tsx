import React, { useEffect, useRef } from 'react';

interface VUMeterProps {
  analyserNode: AnalyserNode | null;
  height?: number;
  width?: number;
  label?: string;
  isMuted?: boolean;
  stereoAnalyserR?: AnalyserNode | null;
}

export const VUMeter: React.FC<VUMeterProps> = ({
  analyserNode,
  height = 180,
  width = 12,
  label,
  isMuted = false,
  stereoAnalyserR = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peakLRef = useRef<number>(0);
  const peakRRef = useRef<number>(0);
  const clipLRef = useRef<boolean>(false);
  const clipRRef = useRef<boolean>(false);
  const clipTimeoutL = useRef<number | null>(null);
  const clipTimeoutR = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const dataL = new Uint8Array(analyserNode ? analyserNode.frequencyBinCount : 128);
    const dataR = new Uint8Array(stereoAnalyserR ? stereoAnalyserR.frequencyBinCount : 128);

    const render = () => {
      animId = requestAnimationFrame(render);
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, w, h);

      // Compute RMS and peak values
      let normL = 0;
      let normR = 0;

      if (analyserNode && !isMuted) {
        analyserNode.getByteTimeDomainData(dataL);
        let sum = 0;
        let maxSample = 0;
        for (let i = 0; i < dataL.length; i++) {
          const v = (dataL[i] - 128) / 128;
          sum += v * v;
          if (Math.abs(v) > maxSample) maxSample = Math.abs(v);
        }
        const rms = Math.sqrt(sum / dataL.length);
        // Expand dynamics curve for visual punch
        normL = Math.min(1, rms * 3.5);

        if (maxSample > 0.98) {
          clipLRef.current = true;
          if (clipTimeoutL.current) clearTimeout(clipTimeoutL.current);
          clipTimeoutL.current = window.setTimeout(() => { clipLRef.current = false; }, 800);
        }
      }

      if (stereoAnalyserR && !isMuted) {
        stereoAnalyserR.getByteTimeDomainData(dataR);
        let sum = 0;
        let maxSample = 0;
        for (let i = 0; i < dataR.length; i++) {
          const v = (dataR[i] - 128) / 128;
          sum += v * v;
          if (Math.abs(v) > maxSample) maxSample = Math.abs(v);
        }
        const rms = Math.sqrt(sum / dataR.length);
        normR = Math.min(1, rms * 3.5);

        if (maxSample > 0.98) {
          clipRRef.current = true;
          if (clipTimeoutR.current) clearTimeout(clipTimeoutR.current);
          clipTimeoutR.current = window.setTimeout(() => { clipRRef.current = false; }, 800);
        }
      } else {
        normR = normL;
      }

      // Smooth peak hold falloff
      if (normL > peakLRef.current) peakLRef.current = normL;
      else peakLRef.current = Math.max(0, peakLRef.current - 0.015);

      if (normR > peakRRef.current) peakRRef.current = normR;
      else peakRRef.current = Math.max(0, peakRRef.current - 0.015);

      const numSegments = 24;
      const segH = (h - 8) / numSegments;
      const isStereo = !!stereoAnalyserR;
      const colWidth = isStereo ? (w - 3) / 2 : w - 2;

      // Draw Left Bar Segments
      drawBar(ctx, 1, h, colWidth, segH, numSegments, normL, peakLRef.current, clipLRef.current);

      // Draw Right Bar Segments if Stereo
      if (isStereo) {
        drawBar(ctx, colWidth + 2, h, colWidth, segH, numSegments, normR, peakRRef.current, clipRRef.current);
      }
    };

    const drawBar = (
      c: CanvasRenderingContext2D,
      x: number,
      totalH: number,
      barW: number,
      segH: number,
      numSegs: number,
      val: number,
      peakVal: number,
      isClip: boolean
    ) => {
      const activeSegs = Math.floor(val * numSegs);
      const peakSeg = Math.floor(peakVal * numSegs);

      for (let i = 0; i < numSegs; i++) {
        const segY = totalH - (i + 1) * segH;
        const isActive = i < activeSegs;
        const isPeak = i === peakSeg;

        // Color coding: bottom 65% Green, next 20% Yellow, top 15% Red
        let onColor = '#00ff88';
        let offColor = '#0d281a';

        if (i >= numSegs - 3) {
          // Red / Clip zone (+0dB to +6dB)
          onColor = '#ff2a5f';
          offColor = '#380916';
        } else if (i >= numSegs - 8) {
          // Amber / Warning zone (-6dB to -1dB)
          onColor = '#ffb703';
          offColor = '#3a2a02';
        }

        if (isActive) {
          c.fillStyle = onColor;
          c.shadowColor = onColor;
          c.shadowBlur = 4;
        } else if (isPeak) {
          c.fillStyle = onColor;
          c.shadowBlur = 0;
        } else {
          c.fillStyle = offColor;
          c.shadowBlur = 0;
        }

        c.fillRect(x, segY + 1, barW, segH - 1.5);
      }
      c.shadowBlur = 0;

      // Top Clip LED
      if (isClip) {
        c.fillStyle = '#ff0033';
        c.shadowColor = '#ff0033';
        c.shadowBlur = 8;
        c.fillRect(x, 1, barW, 4);
        c.shadowBlur = 0;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      if (clipTimeoutL.current) clearTimeout(clipTimeoutL.current);
      if (clipTimeoutR.current) clearTimeout(clipTimeoutR.current);
    };
  }, [analyserNode, stereoAnalyserR, isMuted]);

  const canvasWidth = stereoAnalyserR ? width * 2 + 3 : width;

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className="bg-[#0b0e14] border border-[#232a38] rounded-sm p-0.5 flex flex-col justify-end shadow-inner"
        style={{ height: height, width: canvasWidth + 4 }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={height - 4}
          className="rounded-xs"
        />
      </div>
      {label && (
        <span className="text-[8px] font-mono font-bold text-slate-400 mt-1 uppercase">
          {label}
        </span>
      )}
    </div>
  );
};
