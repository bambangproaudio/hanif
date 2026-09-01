import React, { useState, useEffect, useRef } from 'react';
import { MusicEQSettings, YouTubeSearchResult, KaraokeQueueItem } from '../types';
import { audioEngine } from '../audio/audioEngine';
import { Knob } from './Knob';
import { POPULAR_KARAOKE_SONGS } from '../data/demoTracks';
import {
  Check,
  Disc3,
  Flame,
  History,
  ListMusic,
  Loader2,
  MicOff,
  Music,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Tv,
  Volume2,
  X,
  Youtube,
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeKaraokePanelProps {
  musicEQ: MusicEQSettings;
  onMusicEQChange: (newEQ: MusicEQSettings) => void;
}

export const YouTubeKaraokePanel: React.FC<YouTubeKaraokePanelProps> = ({
  musicEQ,
  onMusicEQChange,
}) => {
  const [searchInput, setSearchInput] = useState<string>('');
  const [currentVideoId, setCurrentVideoId] = useState<string>('dQw4w9WgXcQ');
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('Bambang Karaoke Workstation Standby');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAutoKaraoke, setIsAutoKaraoke] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'search' | 'queue' | 'library' | 'history'>('search');
  const [queue, setQueue] = useState<KaraokeQueueItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('BambangYTSearchHistory');
      return saved ? JSON.parse(saved) : ['Tiara karaoke', 'Rungkad karaoke koplo', 'Sial Mahalini karaoke', 'Bohemian Rhapsody'];
    } catch {
      return ['Tiara karaoke', 'Rungkad karaoke koplo', 'Sial Mahalini karaoke'];
    }
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('flat');
  const playerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsDebounce = useRef<any>(null);

  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer(currentVideoId);
      };
    } else {
      initPlayer(currentVideoId);
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initPlayer = (videoId: string) => {
    try {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('yt-player-target', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            playsinline: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              // ready
            },
            onStateChange: (e: any) => {
              if (e.data === 1) {
                setIsPlaying(true);
              } else if (e.data === 2) {
                setIsPlaying(false);
              } else if (e.data === 0) {
                // Video ended - auto play next from queue if any
                setIsPlaying(false);
                playNextInQueue();
              }
            },
          },
        });
      }
    } catch (err) {
      console.warn('YouTube Player initialization error:', err);
    }
  };

  const playNextInQueue = () => {
    if (queue.length > 0) {
      const nextSong = queue[0];
      const remaining = queue.slice(1);
      setQueue(remaining);
      loadVideo(nextSong.videoId, nextSong.title);
    }
  };

  // Perform search on YouTube API / Server
  const handleSearch = async (overrideQuery?: string) => {
    const rawQuery = overrideQuery !== undefined ? overrideQuery : searchInput;
    if (!rawQuery.trim()) return;

    setShowSuggestions(false);

    // If query is a direct YouTube URL or 11-char ID
    let extractedId = '';
    const trimmed = rawQuery.trim();
    if (trimmed.includes('youtu.be/')) {
      extractedId = trimmed.split('youtu.be/')[1].split('?')[0];
    } else if (trimmed.includes('youtube.com/watch')) {
      const match = trimmed.match(/[?&]v=([^&#]+)/);
      if (match && match[1]) extractedId = match[1];
    } else if (trimmed.includes('youtube.com/embed/')) {
      extractedId = trimmed.split('youtube.com/embed/')[1].split('?')[0];
    } else if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      extractedId = trimmed;
    }

    if (extractedId) {
      loadVideo(extractedId, `Video ID: ${extractedId}`);
      return;
    }

    // Prepare search query with optional karaoke suffix
    let finalQuery = trimmed;
    if (isAutoKaraoke && !finalQuery.toLowerCase().includes('karaoke') && !finalQuery.toLowerCase().includes('lirik') && !finalQuery.toLowerCase().includes('instrumental') && !finalQuery.toLowerCase().includes('minus one')) {
      finalQuery += ' karaoke';
    }

    // Save to search history
    const updatedHistory = [trimmed, ...searchHistory.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, 12);
    setSearchHistory(updatedHistory);
    try {
      localStorage.setItem('BambangYTSearchHistory', JSON.stringify(updatedHistory));
    } catch {}

    setIsSearching(true);
    setActiveTab('search');

    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(finalQuery)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          setSearchResults(data.results);
        } else {
          // If no results from direct query, fallback to smart suggestion list
          setSearchResults(generateFallbackResults(finalQuery));
        }
      } else {
        setSearchResults(generateFallbackResults(finalQuery));
      }
    } catch (err) {
      console.warn('Search fetch error, fallback results generated:', err);
      setSearchResults(generateFallbackResults(finalQuery));
    } finally {
      setIsSearching(false);
    }
  };

  // Generate fallback rich results in case of connection limits
  const generateFallbackResults = (query: string): YouTubeSearchResult[] => {
    const qLower = query.toLowerCase();
    const matched = POPULAR_KARAOKE_SONGS.filter(
      (s) => s.title.toLowerCase().includes(qLower) || s.artist.toLowerCase().includes(qLower) || s.category.toLowerCase().includes(qLower)
    );

    const baseList: YouTubeSearchResult[] = matched.map((s) => ({
      id: s.youtubeId,
      title: `${s.title} - ${s.artist}`,
      channel: `${s.artist} Karaoke Official`,
      duration: '4:15',
      thumbnail: `https://i.ytimg.com/vi/${s.youtubeId}/hqdefault.jpg`,
      views: 'Karaoke Pro',
      isKaraoke: true,
    }));

    if (baseList.length > 0) return baseList;

    return [
      {
        id: 'dQw4w9WgXcQ',
        title: `${query} (Karaoke Studio Version)`,
        channel: 'Indo Karaoke Studio',
        duration: '3:50',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        views: 'Karaoke HQ',
        isKaraoke: true,
      },
    ];
  };

  // Autocomplete suggestions fetch
  const handleInputChange = (text: string) => {
    setSearchInput(text);
    if (!text.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(suggestionsDebounce.current);
    suggestionsDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(text)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions.slice(0, 6));
            setShowSuggestions(true);
          }
        }
      } catch {}
    }, 250);
  };

  // Load and play selected video
  const loadVideo = (videoId: string, title?: string) => {
    setCurrentVideoId(videoId);
    if (title) setCurrentVideoTitle(title);

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(videoId);
      setIsPlaying(true);
    } else {
      initPlayer(videoId);
    }
  };

  // Add to queue
  const addToQueue = (result: YouTubeSearchResult) => {
    const item: KaraokeQueueItem = {
      id: `${result.id}-${Date.now()}`,
      videoId: result.id,
      title: result.title,
      channel: result.channel,
      thumbnail: result.thumbnail,
      duration: result.duration,
    };
    setQueue([...queue, item]);
  };

  const removeFromQueue = (id: string) => {
    setQueue(queue.filter((q) => q.id !== id));
  };

  // Preset EQs
  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    let newEQ: MusicEQSettings = { ...musicEQ };

    switch (presetKey) {
      case 'flat':
        newEQ = { sub: 0, bass: 0, mid: 0, treble: 0, vocalCut: false };
        break;
      case 'cut-vokal':
        newEQ = { sub: 2, bass: 1, mid: -14, treble: 3, vocalCut: true };
        break;
      case 'bass-plus':
        newEQ = { sub: 7, bass: 5, mid: 0, treble: 2, vocalCut: false };
        break;
      case 'clarity':
        newEQ = { sub: -2, bass: 0, mid: 2.5, treble: 6, vocalCut: false };
        break;
      case 'acoustic':
        newEQ = { sub: 1, bass: 2, mid: 1, treble: 3.5, vocalCut: false };
        break;
      case 'edm':
        newEQ = { sub: 8, bass: 6, mid: -2, treble: 5, vocalCut: false };
        break;
    }

    onMusicEQChange(newEQ);
    audioEngine.setMusicEQ(newEQ);
  };

  const toggleVocalCut = () => {
    const updated = { ...musicEQ, vocalCut: !musicEQ.vocalCut };
    if (!musicEQ.vocalCut) {
      setSelectedPreset('cut-vokal');
    }
    onMusicEQChange(updated);
    audioEngine.setMusicEQ(updated);
  };

  const handleEQChange = (band: keyof MusicEQSettings, val: number | boolean) => {
    const updated = { ...musicEQ, [band]: val };
    setSelectedPreset('custom');
    onMusicEQChange(updated);
    audioEngine.setMusicEQ(updated);
  };

  // Quick Genre tags
  const genreTags = [
    { label: '🔥 Dangdut Koplo', query: 'karaoke dangdut koplo kendang' },
    { label: '🇮🇩 Pop Indonesia', query: 'karaoke pop indonesia terbaru' },
    { label: '🎸 Rock / Pop 90s', query: 'karaoke sheila on 7 dewa 19' },
    { label: '🎹 Akustik Ballad', query: 'karaoke akustik piano' },
    { label: '✨ Judika & Mahalini', query: 'karaoke judika mahalini tiara' },
    { label: '🌏 Barat / Global', query: 'karaoke english pop songs' },
  ];

  return (
    <div className="bg-[#121620] border border-[#262e3d] rounded-lg p-3 flex flex-col gap-2.5 shadow-xl">
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-[#232a38] pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 shadow-sm">
            <Youtube className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>YouTube Karaoke Engine</span>
              <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] px-1.5 py-0.2 rounded font-mono">
                LIVE SEARCH
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">Direct Song Search, Video Backing Track & Vocal Cut</p>
          </div>
        </div>

        {/* Vocal Cut Active Indicator */}
        <button
          id="btn-toggle-vocal-cut"
          onClick={toggleVocalCut}
          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all border ${
            musicEQ.vocalCut
              ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/40 animate-pulse'
              : 'bg-[#1b212c] text-slate-400 border-[#2f3849] hover:text-slate-200'
          }`}
          title="Filter / Attenuate center vocal band on music"
        >
          <MicOff className="w-3.5 h-3.5" />
          {musicEQ.vocalCut ? 'CUT VOKAL ON' : 'CUT VOKAL OFF'}
        </button>
      </div>

      {/* Main Direct Search Bar */}
      <div className="relative">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              id="yt-search-input"
              value={searchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
                if (e.key === 'Escape') setShowSuggestions(false);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Cari lagu apa saja (misal: Rungkad, Tiara, Judika, Sial)..."
              className="w-full bg-[#0a0d14] border border-[#293243] hover:border-cyan-500/50 focus:border-cyan-400 rounded-md pl-8 pr-8 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            id="btn-execute-yt-search"
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 px-4 py-2 rounded-md text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 whitespace-nowrap"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>{isSearching ? 'Mencari...' : 'Cari Lagu'}</span>
          </button>
        </div>

        {/* Live Autocomplete Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#0e121a] border border-[#263142] rounded-lg shadow-2xl overflow-hidden">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchInput(sug);
                  setShowSuggestions(false);
                  handleSearch(sug);
                }}
                className="w-full text-left px-3 py-2 text-xs font-mono text-slate-300 hover:bg-[#1b2332] hover:text-cyan-300 flex items-center gap-2 border-b border-[#1a212e] last:border-0 transition-colors"
              >
                <Search className="w-3 h-3 text-slate-500" />
                <span className="truncate">{sug}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Bar: Auto Karaoke Checkbox & Genre Quick Chips */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#0e1219] p-2 rounded-md border border-[#202735]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-mono text-slate-300">
          <input
            type="checkbox"
            checked={isAutoKaraoke}
            onChange={(e) => setIsAutoKaraoke(e.target.checked)}
            className="w-3.5 h-3.5 accent-cyan-400 rounded cursor-pointer"
          />
          <span className="font-bold text-cyan-400">Auto +Karaoke</span>
          <span className="text-slate-500">(Otomatis cari versi karaoke/lirik)</span>
        </label>

        {/* Quick Genre Quick Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 scrollbar-none">
          {genreTags.map((g, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchInput(g.query);
                handleSearch(g.query);
              }}
              className="bg-[#161c28] hover:bg-[#20293a] text-slate-300 hover:text-cyan-300 border border-[#252f42] px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap transition-all"
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* YouTube Player Stage */}
      <div className="relative w-full h-[185px] bg-black rounded-lg overflow-hidden border border-[#202735] shadow-2xl flex flex-col">
        <div id="yt-player-target" className="w-full h-full" />
      </div>

      {/* Now Playing Bar & Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-[#232a38] pb-1.5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 border ${
              activeTab === 'search'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm'
                : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
            }`}
          >
            <Search className="w-3 h-3" />
            Hasil Pencarian {searchResults.length > 0 && `(${searchResults.length})`}
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 border ${
              activeTab === 'queue'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-sm'
                : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
            }`}
          >
            <ListMusic className="w-3 h-3 text-emerald-400" />
            Antrian {queue.length > 0 && `(${queue.length})`}
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 border ${
              activeTab === 'library'
                ? 'bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-sm'
                : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            Pilihan Populer
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 border ${
              activeTab === 'history'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-sm'
                : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200'
            }`}
          >
            <History className="w-3 h-3 text-amber-400" />
            Riwayat
          </button>
        </div>
      </div>

      {/* Tab Content Container */}
      <div className="bg-[#0c1017] p-2 rounded-lg border border-[#1f2635] min-h-[160px] max-h-[220px] overflow-y-auto pr-1">
        {/* 1. SEARCH RESULTS TAB */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-1.5">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-mono">Sedang mencari lagu dari YouTube...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div
                  key={result.id}
                  className={`bg-[#131822] hover:bg-[#1a2230] border p-2 rounded-lg flex items-center justify-between gap-2.5 transition-all group ${
                    currentVideoId === result.id ? 'border-cyan-400 bg-cyan-950/20' : 'border-[#222b3a]'
                  }`}
                >
                  {/* Thumbnail with overlay duration */}
                  <div
                    className="relative w-16 h-11 bg-black rounded overflow-hidden flex-shrink-0 cursor-pointer group-hover:opacity-90"
                    onClick={() => loadVideo(result.id, result.title)}
                  >
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                    </div>
                    {result.duration && (
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono px-1 rounded text-white">
                        {result.duration}
                      </span>
                    )}
                  </div>

                  {/* Title & Channel */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => loadVideo(result.id, result.title)}
                  >
                    <div className="text-xs font-bold font-mono text-slate-200 group-hover:text-cyan-300 truncate leading-snug">
                      {result.title}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="truncate">{result.channel}</span>
                      {result.isKaraoke && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[8px] font-mono px-1 py-0.2 rounded">
                          KARAOKE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => loadVideo(result.id, result.title)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
                      title="Putar Video Sekarang"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      Putar
                    </button>
                    <button
                      onClick={() => addToQueue(result)}
                      className="bg-[#1c2433] hover:bg-[#283449] text-slate-300 hover:text-emerald-300 border border-[#2c374d] p-1.5 rounded transition-all"
                      title="Tambah ke Antrian Lagu"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-1.5 text-center">
                <Search className="w-6 h-6 text-slate-600 mb-1" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  Cari Lagu Karaoke Favorit Anda
                </span>
                <p className="text-[10px] text-slate-500 max-w-xs">
                  Ketik judul lagu atau nama penyanyi di kolom pencarian di atas, lalu tekan Enter atau klik "Cari Lagu".
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. KARAOKE PLAYLIST QUEUE */}
        {activeTab === 'queue' && (
          <div className="flex flex-col gap-1.5">
            {queue.length > 0 ? (
              queue.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-[#131822] border border-[#222b3a] p-2 rounded-lg flex items-center justify-between gap-2.5"
                >
                  <span className="text-[10px] font-mono font-bold text-slate-500 w-4">
                    #{index + 1}
                  </span>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-12 h-8 object-cover rounded bg-black flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold font-mono text-slate-200 truncate">
                      {item.title}
                    </div>
                    <span className="text-[9px] text-slate-400">{item.channel}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        loadVideo(item.videoId, item.title);
                        removeFromQueue(item.id);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-slate-950" />
                      Mainkan
                    </button>
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-500/10"
                      title="Hapus dari antrian"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-1 text-center">
                <ListMusic className="w-6 h-6 text-slate-600 mb-1" />
                <span className="text-xs font-mono text-slate-300">Antrian Karaoke Kosong</span>
                <p className="text-[10px] text-slate-500">
                  Klik tombol <strong>+</strong> pada hasil pencarian untuk menambahkan lagu ke daftar antrian.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. POPULAR LIBRARY */}
        {activeTab === 'library' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {POPULAR_KARAOKE_SONGS.map((song) => (
              <button
                key={song.id}
                onClick={() => {
                  setSearchInput(`${song.title} ${song.artist}`);
                  loadVideo(song.youtubeId, `${song.title} - ${song.artist}`);
                }}
                className="text-left bg-[#131822] hover:bg-[#1a2230] border border-[#222b3a] hover:border-cyan-500/40 p-2 rounded-lg transition-all group flex flex-col justify-between"
              >
                <div className="text-[11px] font-bold font-mono text-slate-200 group-hover:text-cyan-300 truncate">
                  {song.title}
                </div>
                <div className="text-[9px] text-slate-400 flex items-center justify-between mt-1">
                  <span>{song.artist}</span>
                  <span className="text-amber-400/80 font-mono">Nada: {song.key}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 4. RECENT SEARCH HISTORY */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between pb-1 text-[10px] font-mono text-slate-400">
              <span>Riwayat Pencarian Terakhir:</span>
              <button
                onClick={() => {
                  setSearchHistory([]);
                  localStorage.removeItem('BambangYTSearchHistory');
                }}
                className="text-rose-400 hover:text-rose-300"
              >
                Hapus Riwayat
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {searchHistory.map((hist, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSearchInput(hist);
                    handleSearch(hist);
                  }}
                  className="bg-[#141923] hover:bg-[#1d2535] border border-[#222b3a] hover:border-cyan-500/40 p-2 rounded text-left text-xs font-mono text-slate-300 hover:text-cyan-300 truncate transition-all flex items-center gap-1.5"
                >
                  <History className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">{hist}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pro YouTube / Music Parametric EQ Section */}
      <div className="bg-[#0e1219] p-2.5 rounded-lg border border-[#202735] flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-[#1c2330] pb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1">
            <Disc3 className="w-3.5 h-3.5" />
            PRO MUSIC PARAMETRIC EQ (4-BAND)
          </span>
          <span className="text-[9px] font-mono text-slate-400">±18 dB Dynamic Control</span>
        </div>

        {/* 4 EQ Rotary Knobs */}
        <div className="grid grid-cols-4 gap-2 justify-items-center py-1">
          <Knob
            label="Sub (60Hz)"
            value={musicEQ.sub}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="cyan"
            size="sm"
            onChange={(val) => handleEQChange('sub', val)}
          />
          <Knob
            label="Bass (250Hz)"
            value={musicEQ.bass}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="green"
            size="sm"
            onChange={(val) => handleEQChange('bass', val)}
          />
          <Knob
            label="Mid HQ (1.5k)"
            value={musicEQ.mid}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="amber"
            size="sm"
            onChange={(val) => handleEQChange('mid', val)}
          />
          <Knob
            label="Treble (10k)"
            value={musicEQ.treble}
            min={-18}
            max={18}
            step={0.5}
            defaultValue={0}
            unit="dB"
            color="purple"
            size="sm"
            onChange={(val) => handleEQChange('treble', val)}
          />
        </div>

        {/* EQ Preset Quick Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#1c2330]">
          {[
            { key: 'flat', label: 'Flat' },
            { key: 'cut-vokal', label: 'Cut Vokal' },
            { key: 'bass-plus', label: 'Bass+' },
            { key: 'clarity', label: 'Clarity' },
            { key: 'acoustic', label: 'Acoustic' },
            { key: 'edm', label: 'EDM Boost' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => applyPreset(item.key)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition-all border ${
                selectedPreset === item.key
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-sm'
                  : 'bg-[#151a24] text-slate-400 border-[#242c3b] hover:text-slate-200 hover:border-slate-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
