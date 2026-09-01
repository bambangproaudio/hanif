import React, { useState, useRef, useEffect, useCallback } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'blue';
  onChange: (val: number) => void;
  formatValue?: (val: number) => string;
}

export const Knob: React.FC<KnobProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  unit = '',
  size = 'md',
  color = 'cyan',
  onChange,
  formatValue,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);
  const knobRef = useRef<HTMLDivElement>(null);

  // Normalize 0 to 1
  const normalized = Math.min(1, Math.max(0, (value - min) / (max - min)));
  // Angle: -135 deg to +135 deg (270 deg arc total)
  const angle = -135 + normalized * 270;

  const colorClasses = {
    cyan: {
      arc: '#00e5ff',
      glow: 'rgba(0, 229, 255, 0.4)',
      text: 'text-cyan-400',
    },
    green: {
      arc: '#00ff88',
      glow: 'rgba(0, 255, 136, 0.4)',
      text: 'text-emerald-400',
    },
    amber: {
      arc: '#ffb703',
      glow: 'rgba(255, 183, 3, 0.4)',
      text: 'text-amber-400',
    },
    red: {
      arc: '#ff3366',
      glow: 'rgba(255, 51, 102, 0.4)',
      text: 'text-rose-400',
    },
    purple: {
      arc: '#b5179e',
      glow: 'rgba(181, 23, 158, 0.4)',
      text: 'text-purple-400',
    },
    blue: {
      arc: '#3a86ff',
      glow: 'rgba(58, 134, 255, 0.4)',
      text: 'text-blue-400',
    },
  }[color];

  const sizeDimensions = {
    sm: { diameter: 36, radius: 15, stroke: 3, fontSize: 'text-[9px]' },
    md: { diameter: 44, radius: 18, stroke: 3.5, fontSize: 'text-[10px]' },
    lg: { diameter: 54, radius: 22, stroke: 4, fontSize: 'text-[11px]' },
  }[size];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      startYRef.current = e.touches[0].clientY;
      startValRef.current = value;
    }
  };

  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    const newVal = Math.min(max, Math.max(min, Number((value + delta).toFixed(2))));
    onChange(newVal);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaY = startYRef.current - e.clientY;
    const sensitivity = (max - min) / (e.shiftKey ? 400 : 150);
    const rawVal = startValRef.current + deltaY * sensitivity;
    const steppedVal = Math.round(rawVal / step) * step;
    const clampedVal = Math.min(max, Math.max(min, Number(steppedVal.toFixed(2))));
    onChange(clampedVal);
  }, [isDragging, max, min, step, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaY = startYRef.current - e.touches[0].clientY;
    const sensitivity = (max - min) / 150;
    const rawVal = startValRef.current + deltaY * sensitivity;
    const steppedVal = Math.round(rawVal / step) * step;
    const clampedVal = Math.min(max, Math.max(min, Number(steppedVal.toFixed(2))));
    onChange(clampedVal);
  }, [isDragging, max, min, step, onChange]);

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

  // SVG Arc calculation
  const { diameter, radius, stroke } = sizeDimensions;
  const center = diameter / 2;
  const circumference = 2 * Math.PI * radius;
  // 270 deg of circle
  const arcLength = (270 / 360) * circumference;
  const strokeDashoffset = arcLength * (1 - normalized);

  const displayString = formatValue
    ? formatValue(value)
    : `${value > 0 && min < 0 ? '+' : ''}${value}${unit}`;

  return (
    <div className="flex flex-col items-center select-none group">
      <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 mb-1">
        {label}
      </span>

      <div
        ref={knobRef}
        id={`knob-${label.toLowerCase().replace(/\s+/g, '-')}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        title="Double-click to reset, scroll/drag to adjust"
        className="relative cursor-ns-resize touch-none flex items-center justify-center"
        style={{ width: diameter, height: diameter }}
      >
        {/* Background Arc & Fill Arc */}
        <svg
          width={diameter}
          height={diameter}
          className="absolute inset-0 -rotate-[225deg] transform pointer-events-none"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#202632"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colorClasses.arc}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: isDragging ? `drop-shadow(0 0 6px ${colorClasses.glow})` : undefined,
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.05s linear',
            }}
          />
        </svg>

        {/* Knob Body & Indicator Pointer */}
        <div
          className={`rounded-full bg-gradient-to-b from-[#2a303c] via-[#1c212b] to-[#141820] border border-[#374151] flex items-center justify-center shadow-lg transition-transform ${
            isDragging ? 'scale-95 shadow-cyan-500/20' : ''
          }`}
          style={{
            width: diameter - 8,
            height: diameter - 8,
            transform: `rotate(${angle}deg)`,
          }}
        >
          {/* Top Notch Pointer */}
          <div
            className="w-1 rounded-full absolute top-1"
            style={{
              height: size === 'sm' ? 4 : 6,
              backgroundColor: colorClasses.arc,
              boxShadow: `0 0 5px ${colorClasses.arc}`,
            }}
          />
          {/* Subtle metallic bevel center */}
          <div className="w-2 h-2 rounded-full bg-[#12161f] border border-[#2b3342]" />
        </div>
      </div>

      {/* Numerical Value Readout */}
      <span
        className={`mt-1 font-mono ${sizeDimensions.fontSize} font-semibold ${colorClasses.text} bg-[#12151c] px-1.5 py-0.5 rounded border border-[#252b38] leading-none`}
      >
        {displayString}
      </span>
    </div>
  );
};
