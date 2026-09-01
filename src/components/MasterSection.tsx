import React, { useState, useEffect } from 'react';
import { Fader } from './Fader';
import { VUMeter } from './VUMeter';
import { audioEngine } from '../audio/audioEngine';
import { Download, Mic, Play, Radio, Shield, Square, Volume2, VolumeX, Cloud, Loader2 } from 'lucide-react';
import { initAuth, googleSignIn, logout, getAccessToken } from '../lib/auth';
import { uploadFileToDrive } from '../lib/drive';
import { User } from 'firebase/auth';

interface MasterSectionProps {
  masterVol: number;
  onMasterVolChange: (val: number) => void;
}

export const MasterSection: React.FC<MasterSectionProps> = ({
  masterVol,
  onMasterVolChange,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const [isDimmed, setIsDimmed] = useState<boolean>(false);
  const [prevVol, setPrevVol] = useState<number>(masterVol);

  // Auth State
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleToggleRecord = async () => {
    if (!audioEngine.isRunning) {
      alert('Aktifkan Audio Engine terlebih dahulu!');
      return;
    }

    if (!isRecording) {
      const ok = audioEngine.startRecording();
      if (ok) {
        setIsRecording(true);
        setRecordedUrl(null);
        setRecordedBlob(null);
        setUploadSuccess(false);
      }
    } else {
      try {
        const result = await audioEngine.stopRecording();
        setIsRecording(false);
        setRecordedUrl(result.url);
        setRecordedBlob(result.blob);
      } catch (err) {
        console.error('Stop record error:', err);
        setIsRecording(false);
      }
    }
  };

  const toggleDim = () => {
    if (!isDimmed) {
      setPrevVol(masterVol);
      onMasterVolChange(0.2);
      audioEngine.setMasterVolume(0.2);
      setIsDimmed(true);
    } else {
      onMasterVolChange(prevVol);
      audioEngine.setMasterVolume(prevVol);
      setIsDimmed(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!recordedBlob) return;
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      const filename = `Bambang-Mixer-Pro-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      await uploadFileToDrive(recordedBlob, filename);
      setUploadSuccess(true);
      alert('Berhasil menyimpan rekaman ke Google Drive!');
    } catch (error) {
      console.error('Save to drive error:', error);
      alert('Gagal menyimpan ke Google Drive. Pastikan Anda sudah login dan memberi izin.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-[#121620] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-3 shadow-xl h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232a38] pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Master Section & Recorder
            </h2>
            <p className="text-[10px] text-slate-400">Stereo Bus & Live Performance Capture</p>
          </div>
        </div>
        
        {/* Drive Profile Indicator */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1.5 bg-[#1b2230] px-2 py-1 rounded border border-[#2d374a]">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-4 h-4 rounded-full" />
              ) : (
                <div className="w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-900">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-[9px] font-mono text-slate-300 truncate max-w-[80px]">
                {user.displayName || user.email}
              </span>
              <button onClick={handleLogout} className="text-[8px] text-rose-400 hover:text-rose-300 ml-1">
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all"
            >
              {isLoggingIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
              Hubungkan GDrive
            </button>
          )}
        </div>
      </div>

      {/* Main Master Controls Layout */}
      <div className="flex flex-col gap-3 flex-1 justify-between">
        {/* Master Fader & Stereo Dual VU Meter */}
        <div className="bg-[#161b26] border border-[#2b3547] rounded-lg p-3 flex items-center justify-around shadow-inner">
          {/* Master Fader */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-mono font-extrabold text-cyan-400 mb-1 uppercase">
              Master L/R
            </span>
            <Fader
              label="Master"
              value={masterVol}
              min={0}
              max={1.2}
              color="cyan"
              height={180}
              onChange={(val) => {
                onMasterVolChange(val);
                audioEngine.setMasterVolume(val);
              }}
            />
          </div>

          {/* Dual Stereo VU Meter */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 mb-1">
              L • R STEREO
            </span>
            <VUMeter
              analyserNode={audioEngine.masterAnalyserL || audioEngine.masterAnalyser}
              stereoAnalyserR={audioEngine.masterAnalyserR}
              height={180}
              width={14}
              label="OUT"
            />
          </div>
        </div>

        {/* DIM & Limiter Badges */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleDim}
            className={`py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all border ${
              isDimmed
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                : 'bg-[#181e2b] text-slate-400 border-[#2d374a] hover:text-slate-200'
            }`}
          >
            {isDimmed ? 'DIM -20dB ACTIVE' : 'DIM -20dB'}
          </button>

          <div className="bg-[#181e2b] border border-[#2d374a] rounded px-2 py-1 flex items-center justify-center gap-1 text-[10px] font-mono text-emerald-400">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>LIMITER ACTIVE</span>
          </div>
        </div>

        {/* Live Audio Recorder Deck */}
        <div className="bg-[#0e121a] p-3 rounded-lg border border-[#202735] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                }`}
              />
              Live Session Recorder
            </span>

            {isRecording && (
              <span className="text-xs font-mono font-bold text-rose-400 animate-pulse">
                REC • {Math.floor(audioEngine.recordingDuration / 60)}:
                {String(audioEngine.recordingDuration % 60).padStart(2, '0')}
              </span>
            )}
          </div>

          <button
            id="btn-master-record"
            onClick={handleToggleRecord}
            className={`w-full py-2.5 rounded-md font-mono text-xs font-extrabold uppercase flex items-center justify-center gap-2 transition-all border ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-600/50 animate-pulse'
                : 'bg-[#1b2230] hover:bg-[#252e42] text-rose-400 border-rose-500/30'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                Stop Recording & Process
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                Record Full Master Mix
              </>
            )}
          </button>

          {/* Download & Playback after recording */}
          {recordedUrl && (
            <div className="bg-[#151b27] p-2.5 rounded-md border border-emerald-500/30 flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  ✓ Rekaman Selesai
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveToDrive}
                    disabled={!user || isUploading}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all ${
                      uploadSuccess 
                        ? 'bg-blue-900/50 text-blue-400 border border-blue-500/30'
                        : user 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20' 
                          : 'bg-[#1b2230] text-slate-500 border border-[#2d374a] cursor-not-allowed'
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Cloud className="w-3 h-3" />
                    )}
                    {uploadSuccess ? 'Tersimpan di Drive' : 'Simpan ke Drive'}
                  </button>

                  <a
                    href={recordedUrl}
                    download={`Bambang-Mixer-Pro-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20"
                  >
                    <Download className="w-3 h-3" />
                    Unduh
                  </a>
                </div>
              </div>
              <audio src={recordedUrl} controls className="w-full h-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
