import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import yts from 'yt-search';

const app = express();
const PORT = 3000;

app.use(express.json());

interface YTSearchItem {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  views?: string;
  isKaraoke: boolean;
}

// API Routes
app.get('/api/youtube/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ results: [] });
  }

  try {
    const r = await yts(query);
    const videos = r.videos.slice(0, 25);
    
    const results: YTSearchItem[] = videos.map(v => {
      const lowerTitle = v.title.toLowerCase();
      const isKaraoke =
        lowerTitle.includes('karaoke') ||
        lowerTitle.includes('instrumental') ||
        lowerTitle.includes('lirik') ||
        lowerTitle.includes('minus one') ||
        lowerTitle.includes('backing track');
        
      return {
        id: v.videoId,
        title: v.title,
        channel: v.author?.name || 'YouTube',
        duration: v.timestamp || '0:00',
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        views: v.views ? v.views.toString() : '',
        isKaraoke
      };
    });

    return res.json({ results, source: 'yt-search' });
  } catch (error) {
    console.error('YouTube search error:', error);
    return res.status(500).json({ error: 'Search failed', results: [] });
  }
});

// Autocomplete suggestions endpoint
app.get('/api/youtube/suggestions', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ suggestions: [] });
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    });
    const text = await response.text();
    // Format: window.google.ac.h(["query",[["item1",0],["item2",0]]])
    const match = text.match(/\((.*)\)$/);
    if (match && match[1]) {
      const parsed = JSON.parse(match[1]);
      const rawSuggestions = parsed[1] || [];
      const suggestions = rawSuggestions.map((item: any) => item[0]);
      return res.json({ suggestions });
    }
    return res.json({ suggestions: [] });
  } catch {
    return res.json({ suggestions: [] });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bambang Mixer Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
