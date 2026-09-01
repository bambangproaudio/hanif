export interface KaraokeSuggestion {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  category: string;
  key: string;
}

export const POPULAR_KARAOKE_SONGS: KaraokeSuggestion[] = [
  {
    id: '1',
    title: 'Tiara (Karaoke Piano & Bass)',
    artist: 'Raffa Affar / Kris',
    youtubeId: 'dQw4w9WgXcQ', // fallback or embed
    category: 'Pop Indo',
    key: 'Am',
  },
  {
    id: '2',
    title: 'Sial (Karaoke Acoustic Version)',
    artist: 'Mahalini',
    youtubeId: 'M7lc1UVf-VE',
    category: 'Pop Indo',
    key: 'C',
  },
  {
    id: '3',
    title: 'Rungkad (Dangdut Koplo Karaoke)',
    artist: 'Happy Asmara',
    youtubeId: 'jNQXAC9IVRw',
    category: 'Dangdut',
    key: 'G',
  },
  {
    id: '4',
    title: 'Bohemian Rhapsody (Full Backing Track)',
    artist: 'Queen',
    youtubeId: 'fJ9rUzIMcZQ',
    category: 'Rock Classics',
    key: 'Bb',
  },
  {
    id: '5',
    title: 'Perfect (Acoustic Guitar Karaoke)',
    artist: 'Ed Sheeran',
    youtubeId: '2Vv-BfVoq4g',
    category: 'Pop Acoustic',
    key: 'Ab',
  },
  {
    id: '6',
    title: 'Careless Whisper (Saxophone Instrumental)',
    artist: 'George Michael',
    youtubeId: 'izGwDsrQ1eQ',
    category: 'Evergreen',
    key: 'Dm',
  },
];

export interface BuiltinBackingTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  genre: string;
  audioUrl?: string; // or synthesized loop
}

export const DEMO_BACKING_TRACKS: BuiltinBackingTrack[] = [
  {
    id: 'track-acoustic',
    title: 'Acoustic Guitar Soul Ballad',
    artist: 'Bambang Studio Live',
    bpm: 78,
    genre: 'Acoustic Ballad',
  },
  {
    id: 'track-koplo',
    title: 'Dangdut Koplo Kendang Beat 135 BPM',
    artist: 'Bambang Koplo DSP',
    bpm: 135,
    genre: 'Dangdut Koplo',
  },
  {
    id: 'track-pop',
    title: 'Modern Pop Drums & Synth Bass',
    artist: 'Studio Session 01',
    bpm: 118,
    genre: 'Pop / RnB',
  },
  {
    id: 'track-lofi',
    title: 'Lo-Fi Chill Warm Piano Groove',
    artist: 'Midnight Lounge',
    bpm: 84,
    genre: 'Lo-Fi Chill',
  }
];
