import React, { useState, useRef, useEffect } from 'react';
import { DEMO_BACKING_TRACKS, BuiltinBackingTrack } from '../data/demoTracks';
import { audioEngine } from '../audio/audioEngine';
import { Disc, FastForward, FileAudio, Pause, Play, Repeat, Rewind, Upload, Volume2 } from 'lucide-react';

export const BackingTrackPlayer: React.FC = () => {
  const [currentTrackName, setCurrentTrackName] = useState<string>('Demo Acoustic Ballad');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [selectedDemo, setSelectedDemo] = useState<string>('track-acoustic');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synthesize background audio stream or attach audio element
  useEffect(() => {
    if (audioRef.current) {
      audioEngine.attachAudioElement(audioRef.current);
    }
  }, []);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback prevented:', err);
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioRef.current) return;

    const fileUrl = URL.createObjectURL(file);
    audioRef.current.src = fileUrl;
    setCurrentTrackName(file.name);
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    });
  };

  const handleSelectDemo = (track: BuiltinBackingTrack) => {
    setSelectedDemo(track.id);
    setCurrentTrackName(track.title);
    // Use an accessible royalty-free backing track sample or synthesized demo
    if (audioRef.current) {
      // Free audio asset source
      audioRef.current.src = 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg';
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  return (
    <div className="bg-[#121620] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-2.5 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#232a38] pb-1.5">
        <div className="flex items-center gap-2">
          <FileAudio className="w-4 h-4 text-emerald-400" />
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Audio File Deck & Backing Tracks
            </h2>
            <p className="text-[10px] text-slate-400">MP3/WAV Player with Speed & Pitch Shift</p>
          </div>
        </div>

        {/* Upload Custom MP3 Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#1a212e] hover:bg-[#252f42] text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all"
        >
          <Upload className="w-3 h-3" />
          Load File Audio
        </button>
      </div>

      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        loop={isLooping}
        crossOrigin="anonymous"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 180);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Track Title & Transport Controls */}
      <div className="bg-[#0e1219] p-2.5 rounded-lg border border-[#202735] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Disc className={`w-4 h-4 text-emerald-400 ${isPlaying ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold font-mono text-slate-200 truncate">
              {currentTrackName}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} /{' '}
            {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
          </span>
        </div>

        {/* Progress Timeline */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setCurrentTime(val);
            if (audioRef.current) audioRef.current.currentTime = val;
          }}
          className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-[#18202d] rounded-lg"
        />

        {/* Transport Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTogglePlay}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded text-xs font-mono font-extrabold uppercase flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
              {isPlaying ? 'Pause' : 'Play Track'}
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded border transition-all ${
                isLooping
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60'
                  : 'bg-[#151a24] text-slate-500 border-[#242c3b]'
              }`}
              title="Loop Track"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed / Pitch multiplier */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-slate-400">Speed:</span>
            {[0.85, 1.0, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-1.5 py-0.5 rounded border transition-all ${
                  playbackRate === rate
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 font-bold'
                    : 'bg-[#151a24] text-slate-400 border-[#242c3b]'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
