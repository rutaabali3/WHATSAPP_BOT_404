import axios, { AxiosInstance } from 'axios';
import { MessageRepository } from './db.js';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
}

export interface DownloaderResult {
  title?: string;
  source: string;
  downloadUrl?: string;
  mediaType: 'video' | 'audio' | 'image';
  thumbnail?: string;
  quality?: string;
  streamBuffer?: Buffer;
}

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private primaryBaseUrl: string;
  private cobaltBaseUrl: string;
  private groqVoiceKey: string;
  private groqFallbackKey: string;

  private searxngPool: string[] = [
    'https://searx.be',
    'https://searx.tiekoetter.com',
    'https://priv.au',
    'https://searx.dresden.network',
    'https://searx.lunar.icu',
    'https://search.rowie.at',
    'https://paulgo.io'
  ];
  private searxngIndex = 0;

  constructor(
    private db: MessageRepository,
    primaryBaseUrl: string = process.env.API_BASE_URL || 'https://ahm7xmakki.com',
    cobaltBaseUrl: string = process.env.COBALT_API_URL || 'https://api.cobalt.tools',
    groqVoiceKey: string = process.env.GROQ_API_KEY_VOICE || process.env.GROQ_API_KEY || '',
    groqFallbackKey: string = process.env.GROQ_API_KEY_CHAT || ''
  ) {
    this.primaryBaseUrl = primaryBaseUrl.replace(/\/+$/, '');
    this.cobaltBaseUrl = cobaltBaseUrl.replace(/\/+$/, '');
    this.groqVoiceKey = groqVoiceKey;
    this.groqFallbackKey = groqFallbackKey;

    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
  }

  // --- SearXNG Web Search (with DuckDuckGo fallback) ---
  public async searchWeb(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    const start = Date.now();
    let lastError: any = null;

    // 1. Try SearXNG pool (skip instances returning HTML captcha pages)
    for (let i = 0; i < this.searxngPool.length; i++) {
      const baseUrl = this.searxngPool[(this.searxngIndex + i) % this.searxngPool.length];
      try {
        const res = await this.axiosInstance.get(`${baseUrl}/search`, {
          params: { q: query, format: 'json' },
          timeout: 8000,
          validateStatus: (s) => s === 200
        });

        const contentType = String(res.headers?.['content-type'] || '');
        if (!contentType.includes('json')) continue; // Skip HTML captcha pages

        if (res.data && Array.isArray(res.data.results) && res.data.results.length > 0) {
          this.searxngIndex = (this.searxngIndex + i) % this.searxngPool.length;
          const items: SearchResult[] = res.data.results.slice(0, maxResults).map((r: any) => ({
            title: r.title || 'Untitled',
            url: r.url,
            snippet: r.content || r.snippet || '',
            engine: r.engine || 'meta'
          }));

          await this.db.logApiUsage('searxng_search', Date.now() - start, 200, false);
          return items;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    // 2. Fallback: DuckDuckGo Instant Answer API
    try {
      const ddgRes = await this.axiosInstance.get('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_html: 1, skip_disambig: 1 },
        timeout: 8000
      });

      const items: SearchResult[] = [];
      if (ddgRes.data?.AbstractText) {
        items.push({
          title: ddgRes.data.Heading || query,
          url: ddgRes.data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
          snippet: ddgRes.data.AbstractText,
          engine: 'duckduckgo'
        });
      }
      if (ddgRes.data?.RelatedTopics) {
        for (const topic of ddgRes.data.RelatedTopics.slice(0, maxResults - items.length)) {
          if (topic.Text && topic.FirstURL) {
            items.push({
              title: topic.Text.split(' - ')[0] || 'Related',
              url: topic.FirstURL,
              snippet: topic.Text,
              engine: 'duckduckgo'
            });
          }
        }
      }
      if (items.length > 0) {
        await this.db.logApiUsage('ddg_search_fallback', Date.now() - start, 200, true);
        return items;
      }
    } catch {
      // DuckDuckGo also failed
    }

    await this.db.logApiUsage('searxng_search', Date.now() - start, 500, false);
    throw lastError || new Error('All search engines failed to respond. Please try again later.');
  }

  // --- Multi-Engine Downloader (.alldl, .yt, etc.) ---
  public async downloadMedia(url: string, forceAudio: boolean = false): Promise<DownloaderResult> {
    const start = Date.now();

    // 1. Try primary upstream (ahm7xmakki)
    try {
      const endpoint = forceAudio ? '/api/ytmp3' : '/api/alldl';
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}${endpoint}`, {
        params: { url },
        timeout: 15000
      });

      if (res.data && (res.data.status === true || res.data.download || res.data.url || res.data.result)) {
        const data = res.data.result || res.data;
        const downloadUrl = data.download || data.url || data.link || (Array.isArray(data.links) ? data.links[0]?.url : null);

        if (downloadUrl) {
          await this.db.logApiUsage('primary_downloader', Date.now() - start, 200, false);
          return {
            title: data.title || 'Media File',
            source: 'primary',
            downloadUrl,
            mediaType: forceAudio ? 'audio' : 'video',
            thumbnail: data.thumbnail || data.thumb
          };
        }
      }
    } catch (err) {
      // Primary failed or timed out, attempt seamless fallback
    }

    // 2. Seamless Fallback: Cobalt Tools API
    try {
      const cobaltPayload: Record<string, any> = {
        url,
        videoQuality: '720',
        audioFormat: 'mp3',
        downloadMode: forceAudio ? 'audio' : 'auto'
      };

      const cobaltRes = await this.axiosInstance.post(
        `${this.cobaltBaseUrl}/api/json`,
        cobaltPayload,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );

      if (cobaltRes.data && (cobaltRes.data.url || cobaltRes.data.stream)) {
        await this.db.logApiUsage('cobalt_fallback', Date.now() - start, 200, true);
        return {
          title: cobaltRes.data.filename || 'Downloaded Media',
          source: 'cobalt_fallback',
          downloadUrl: cobaltRes.data.url || cobaltRes.data.stream,
          mediaType: forceAudio ? 'audio' : 'video'
        };
      }
    } catch (cobaltErr) {
      // Fallback also failed
    }

    await this.db.logApiUsage('downloader_failed', Date.now() - start, 500, false);
    throw new Error('Could not download media from upstream providers. The video may be private, age-restricted, or blocked.');
  }

  // --- Music Finder / Song (.play / .song) ---
  public async searchSong(query: string): Promise<{ title: string; artist: string; downloadUrl: string; duration?: string; thumbnail?: string }> {
    const start = Date.now();

    // 1. Try primary endpoint
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/music`, {
        params: { query },
        timeout: 15000
      });

      if (res.data && (res.data.status === true || res.data.download || res.data.result)) {
        const data = res.data.result || res.data;
        const dl = data.download || data.url || data.link;
        if (dl) {
          await this.db.logApiUsage('primary_music', Date.now() - start, 200, false);
          return {
            title: data.title || query,
            artist: data.artist || 'Unknown Artist',
            downloadUrl: dl,
            duration: data.duration,
            thumbnail: data.thumbnail
          };
        }
      }
    } catch {
      // Primary failed, move to JioSaavn API fallback
    }

    // 2. JioSaavn Direct API Fallback (jiosaavn.com)
    try {
      const searchRes = await this.axiosInstance.get('https://www.jiosaavn.com/api.php', {
        params: {
          __call: 'search.getResults',
          p: 1,
          q: query,
          _format: 'json',
          _marker: '0',
          ctx: 'wap6dot0',
          n: 1
        },
        timeout: 10000
      });

      if (searchRes.data?.results?.length > 0) {
        const song = searchRes.data.results[0];
        // Fetch full song details with media URL
        const detailRes = await this.axiosInstance.get('https://www.jiosaavn.com/api.php', {
          params: {
            __call: 'song.getDetails',
            cc: 'in',
            _marker: '0?_marker=0',
            _format: 'json',
            pids: song.id
          },
          timeout: 10000
        });

        const details = detailRes.data?.[song.id] || Object.values(detailRes.data || {})[0] as any;
        if (details) {
          // JioSaavn provides encrypted_media_url or media_preview_url
          const mediaUrl = details.media_preview_url?.replace('preview', 'aac') ||
                          details.encrypted_media_url ||
                          details.media_url;

          if (mediaUrl) {
            await this.db.logApiUsage('jiosaavn_direct_fallback', Date.now() - start, 200, true);
            const dur = parseInt(details.duration || '0', 10);
            return {
              title: details.song || song.title || query,
              artist: details.primary_artists || details.singers || 'Unknown Artist',
              downloadUrl: mediaUrl,
              duration: dur > 0 ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}` : undefined,
              thumbnail: details.image?.replace('150x150', '500x500') || song.image
            };
          }
        }
      }
    } catch {
      // JioSaavn failed
    }

    // 3. Cobalt / YTDL Fallback (try-catch so it doesn't propagate)
    try {
      const ytdl = await this.downloadMedia(`ytsearch:${query}`, true);
      if (ytdl.downloadUrl) {
        await this.db.logApiUsage('ytdl_song_fallback', Date.now() - start, 200, true);
        return {
          title: ytdl.title || query,
          artist: 'YouTube Audio',
          downloadUrl: ytdl.downloadUrl,
          thumbnail: ytdl.thumbnail
        };
      }
    } catch {
      // Cobalt/YTDL also failed
    }

    throw new Error(`Song not found for: ${query}`);
  }

  // --- Lyrics (.lyrics) ---
  public async getLyrics(songTitle: string): Promise<{ title: string; artist: string; lyrics: string }> {
    const start = Date.now();
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/lyrics`, {
        params: { song: songTitle },
        timeout: 15000
      });

      const data = res.data.result || res.data;
      if (data && data.lyrics) {
        await this.db.logApiUsage('lyrics', Date.now() - start, 200, false);
        return {
          title: data.title || songTitle,
          artist: data.artist || 'Unknown',
          lyrics: data.lyrics
        };
      }
    } catch {
      // Fallback to lrclib / public lyrics API
      try {
        const fallbackRes = await this.axiosInstance.get('https://lrclib.net/api/search', {
          params: { q: songTitle },
          timeout: 8000
        });
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          const item = fallbackRes.data[0];
          await this.db.logApiUsage('lyrics_lrclib_fallback', Date.now() - start, 200, true);
          return {
            title: item.trackName || songTitle,
            artist: item.artistName || 'Unknown',
            lyrics: item.plainLyrics || item.syncedLyrics || 'No lyrics text available.'
          };
        }
      } catch {
        // Fallback failed
      }
    }

    throw new Error(`No lyrics found for "${songTitle}".`);
  }

  // --- Movie Details (.movie) ---
  public async getMovie(title: string): Promise<{
    title: string;
    year: string;
    rating: string;
    genre: string;
    plot: string;
    actors: string;
    poster?: string;
  }> {
    const start = Date.now();
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/movie`, {
        params: { movie: title },
        timeout: 15000
      });
      const data = res.data.result || res.data;
      if (data && data.title) {
        await this.db.logApiUsage('movie', Date.now() - start, 200, false);
        return {
          title: data.title,
          year: data.year || data.released || 'N/A',
          rating: data.rating || data.imdbRating || 'N/A',
          genre: data.genre || 'N/A',
          plot: data.plot || data.overview || 'No synopsis available.',
          actors: data.actors || data.cast || 'N/A',
          poster: data.poster || data.image
        };
      }
    } catch {
      // Primary failed, try OMDB fallback
    }

    // 2. OMDB Free API Fallback
    try {
      const omdbRes = await this.axiosInstance.get('https://www.omdbapi.com/', {
        params: { t: title, apikey: 'trilogy', plot: 'short' },
        timeout: 10000
      });
      if (omdbRes.data && omdbRes.data.Response !== 'False' && omdbRes.data.Title) {
        await this.db.logApiUsage('omdb_movie_fallback', Date.now() - start, 200, true);
        return {
          title: omdbRes.data.Title,
          year: omdbRes.data.Year || 'N/A',
          rating: omdbRes.data.imdbRating ? `${omdbRes.data.imdbRating}/10` : 'N/A',
          genre: omdbRes.data.Genre || 'N/A',
          plot: omdbRes.data.Plot || 'No synopsis available.',
          actors: omdbRes.data.Actors || 'N/A',
          poster: omdbRes.data.Poster !== 'N/A' ? omdbRes.data.Poster : undefined
        };
      }
    } catch {
      // OMDB also failed
    }

    throw new Error(`Movie details could not be found for "${title}".`);
  }

  // --- Trailer (.trailer) ---
  public async getTrailer(title: string): Promise<{ title: string; videoUrl: string }> {
    const start = Date.now();
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/trailer`, {
        params: { movie: title },
        timeout: 15000
      });
      const data = res.data.result || res.data;
      if (data && (data.url || data.videoUrl || data.trailer)) {
        await this.db.logApiUsage('trailer', Date.now() - start, 200, false);
        return {
          title: data.title || `${title} Official Trailer`,
          videoUrl: data.url || data.videoUrl || data.trailer
        };
      }
    } catch {
      // Primary failed
    }

    // 2. Fallback: Return YouTube search URL for trailer
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} official trailer`)}`;
    await this.db.logApiUsage('trailer_yt_search_fallback', Date.now() - start, 200, true);
    return {
      title: `${title} — Official Trailer`,
      videoUrl: ytSearchUrl
    };
  }

  // --- General Utilities (Weather, Quote, Fact, News, Shorten) ---
  public async getWeather(city: string): Promise<string> {
    const start = Date.now();
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/weather`, {
        params: { city },
        timeout: 10000
      });
      const data = res.data.result || res.data;
      await this.db.logApiUsage('weather', Date.now() - start, 200, false);
      if (typeof data === 'string') return data;
      return `🌤️ *Weather in ${data.city || city}*:\n• Condition: ${data.condition || data.weather || 'Clear'}\n• Temp: ${data.temp || data.temperature || 'N/A'}\n• Humidity: ${data.humidity || 'N/A'}\n• Wind: ${data.wind || 'N/A'}`;
    } catch {
      // Fallback to wttr.in
      const wttrRes = await this.axiosInstance.get(`https://wttr.in/${encodeURIComponent(city)}?format=3`, { timeout: 8000 });
      return `🌤️ *Weather*: ${wttrRes.data.trim()}`;
    }
  }

  public async getQuote(): Promise<string> {
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/quote`, { timeout: 8000 });
      const data = res.data.result || res.data;
      if (data.quote) return `"${data.quote}"\n— *${data.author || 'Anonymous'}*`;
    } catch {
      // Primary failed, try ZenQuotes
      try {
        const fallback = await this.axiosInstance.get('https://zenquotes.io/api/random', { timeout: 5000 });
        if (Array.isArray(fallback.data) && fallback.data.length > 0) {
          return `"${fallback.data[0].q}"\n— *${fallback.data[0].a || 'Anonymous'}*`;
        }
      } catch {
        // ZenQuotes also failed
      }
    }
    return '"The best way to predict the future is to create it." — *Peter Drucker*';
  }

  public async getFact(): Promise<string> {
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/fact`, { timeout: 8000 });
      const data = res.data.result || res.data;
      if (data.fact) return `💡 *Fact*: ${data.fact}`;
    } catch {
      const fallback = await this.axiosInstance.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', { timeout: 5000 });
      return `💡 *Fact*: ${fallback.data.text}`;
    }
    return '💡 *Fact*: Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old.';
  }

  public async getNews(): Promise<string> {
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/news`, { timeout: 10000 });
      const data = res.data.result || res.data;
      if (Array.isArray(data)) {
        return data.slice(0, 5).map((n: any, idx: number) => `${idx + 1}. *${n.title}*\n   _${n.source || 'News'}_`).join('\n\n');
      }
    } catch {
      // Primary failed, try search fallback
      try {
        const searchRes = await this.searchWeb('latest news headlines today', 5);
        if (searchRes.length > 0) {
          return searchRes.map((n, idx) => `${idx + 1}. *${n.title}*\n   ${n.url}`).join('\n\n');
        }
      } catch {
        // Search also failed
      }
    }
    return 'No headlines available at the moment. Check back later or visit a news website directly.';
  }

  public async shortenUrl(targetUrl: string): Promise<string> {
    try {
      const res = await this.axiosInstance.get(`${this.primaryBaseUrl}/api/shorten`, {
        params: { url: targetUrl },
        timeout: 10000
      });
      const data = res.data.result || res.data;
      if (data.short || data.shortUrl || data.link) {
        return data.short || data.shortUrl || data.link;
      }
    } catch {
      // TinyURL fallback
      const fallback = await this.axiosInstance.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`, { timeout: 8000 });
      return fallback.data.trim();
    }
    return targetUrl;
  }

  // --- Groq Whisper Speech-to-Text ---
  public async transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/ogg'): Promise<string> {
    const keysToTry = [this.groqVoiceKey, this.groqFallbackKey].filter(Boolean);

    if (keysToTry.length === 0) {
      throw new Error('Groq Voice API Key is not configured. Set GROQ_API_KEY_VOICE in your environment.');
    }

    const start = Date.now();
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Construct multipart form-data without heavy external libraries
    const ext = mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('mp3') ? 'mp3' : 'ogg');
    const filename = `voice_${Date.now()}.${ext}`;

    const preHeader = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    );

    const modelHeader = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-large-v3\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
      `text\r\n` +
      `--${boundary}--\r\n`
    );

    const body = Buffer.concat([preHeader, audioBuffer, modelHeader]);

    let lastError: any = null;
    for (const key of keysToTry) {
      try {
        const res = await this.axiosInstance.post('https://api.groq.com/openai/v1/audio/transcriptions', body, {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`
          },
          timeout: 30000
        });

        await this.db.logApiUsage('groq_whisper', Date.now() - start, 200, key !== keysToTry[0]);
        return typeof res.data === 'string' ? res.data.trim() : (res.data?.text || '');
      } catch (err: any) {
        lastError = err;
        console.warn(`[ApiClient] Groq Whisper request failed with key (...${key.slice(-6)}): ${err.message}. Trying next key if available.`);
      }
    }

    await this.db.logApiUsage('groq_whisper', Date.now() - start, 500, false);
    throw lastError || new Error('Whisper transcription failed on all Groq keys.');
  }

  // --- AI Image Generation (Pollinations.ai) ---
  public async generateImage(prompt: string): Promise<Buffer> {
    const encoded = encodeURIComponent(prompt.trim());
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
    return await this.fetchBuffer(url);
  }

  // Helper to fetch binary buffer directly
  public async fetchBuffer(url: string): Promise<Buffer> {
    const res = await this.axiosInstance.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    return Buffer.from(res.data);
  }
}
