import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FaderProps {
  label: string;
  value: number; // 0 to 1.2 (0 = -inf, 0.8 = 0dB unity, 1.2 = +6dB)
  min?: number;
  max?: number;
  step?: number;
  height?: number;
  color?: 'cyan' | 'green' | 'amber' | 'red' | 'blue';
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const Fader: React.FC<FaderProps> = ({
  label,
  value,
  min = 0,
  max = 1.2,
  height = 180,
  color = 'cyan',
  onChange,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Convert linear value (0 to 1.2) to percentage height (0 to 100%)
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    updateFromPointer(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || e.touches.length !== 1) return;
    setIsDragging(true);
    updateFromPointer(e.touches[0].clientY);
  };

  const updateFromPointer = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(rect.height, relativeY));
    // Invert because bottom is 0% and top is 100%
    const normalized = 1 - (clampedY / rect.height);
    const calculatedValue = min + normalized * (max - min);
    onChange(Number(calculatedValue.toFixed(3)));
  }, [min, max, onChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateFromPointer(e.clientY);
  }, [isDragging, updateFromPointer]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    updateFromPointer(e.touches[0].clientY);
  }, [isDragging, updateFromPointer]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleDoubleClick = () => {
    if (disabled) return;
    onChange(0.8); // Reset to Unity Gain 0dB
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.02 : -0.02;
    const nextVal = Math.min(max, Math.max(min, Number((value + delta).toFixed(3))));
    onChange(nextVal);
  };

  // Compute dB readout
  let dbText = '-∞ dB';
  if (value > 0.001) {
    const db = 20 * Math.log10(value / 0.8);
    dbText = db > 0.1 ? `+${db.toFixed(1)} dB` : `${db.toFixed(1)} dB`;
  }

  const colorStyle = {
    cyan: 'bg-cyan-400 border-cyan-300 shadow-cyan-500/50',
    green: 'bg-emerald-400 border-emerald-300 shadow-emerald-500/50',
    amber: 'bg-amber-400 border-amber-300 shadow-amber-500/50',
    red: 'bg-rose-500 border-rose-300 shadow-rose-500/50',
    blue: 'bg-blue-400 border-blue-300 shadow-blue-500/50',
  }[color];

  return (
    <div className="flex flex-col items-center select-none" onWheel={handleWheel}>
      {/* dB Scale Marks and Fader Track */}
      <div className="flex items-center gap-1.5">
        {/* dB Tick Marks Labels */}
        <div
          className="flex flex-col justify-between text-[8px] font-mono text-slate-400 select-none py-1 pr-0.5 text-right w-6"
          style={{ height: height }}
        >
          <span>+6</span>
          <span className="font-bold text-slate-200">0</span>
          <span>-5</span>
          <span>-10</span>
          <span>-20</span>
          <span>-40</span>
          <span>-∞</span>
        </div>

        {/* Vertical Track Slot */}
        <div
          ref={trackRef}
          id={`fader-${label.toLowerCase().replace(/\s+/g, '-')}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleDoubleClick}
          className={`relative w-8 bg-[#11141c] border border-[#272e3d] rounded cursor-ns-resize shadow-inner flex justify-center py-2 ${
            disabled ? 'opacity-40 pointer-events-none' : ''
          }`}
          style={{ height: height }}
        >
          {/* Center Slot Line */}
          <div className="absolute top-2 bottom-2 w-1.5 bg-[#0a0c10] border-x border-[#1a1f2c] rounded-full" />

          {/* 0dB Unity Mark Indicator Line on Track */}
          <div
            className="absolute left-0 right-0 h-[2px] bg-slate-500/60 pointer-events-none"
            style={{ bottom: `${(0.8 / 1.2) * 100}%` }}
          />

          {/* Metallic Fader Cap / Thumb */}
          <div
            className={`absolute left-0.5 right-0.5 h-8 bg-gradient-to-b from-[#475163] via-[#2a303d] to-[#1e232d] border border-[#525f75] rounded shadow-md transform -translate-y-1/2 flex items-center justify-center transition-shadow ${
              isDragging ? 'shadow-lg ring-1 ring-cyan-400/50' : 'hover:border-slate-300'
            }`}
            style={{
              bottom: `${percentage}%`,
              transition: isDragging ? 'none' : 'bottom 0.05s ease-out',
            }}
          >
            {/* Center Color Accent Line */}
            <div className={`w-full h-1 ${colorStyle} shadow-sm`} />
            {/* Grip Ribs */}
            <div className="absolute top-1 left-2 right-2 flex flex-col gap-0.5 pointer-events-none">
              <div className="h-[1px] bg-white/20" />
            </div>
            <div className="absolute bottom-1 left-2 right-2 flex flex-col gap-0.5 pointer-events-none">
              <div className="h-[1px] bg-black/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Numerical dB Output */}
      <span className="mt-1.5 font-mono text-[10px] font-bold text-cyan-300 bg-[#0d1017] px-1.5 py-0.5 rounded border border-[#252b38] w-14 text-center">
        {dbText}
      </span>
    </div>
  );
};
