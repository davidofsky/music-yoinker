import crypto from 'crypto';
import axios from 'axios';
import Config from './config';

const API_URL = 'https://ws.audioscrobbler.com/2.0/';

export type LastFmPeriod = 'overall' | '7day' | '1month' | '3month' | '6month' | '12month';

export interface LastFmSession {
  name: string;
  key: string;
}

// Names only, no audio.
export interface LastFmTrack {
  artist: string;
  title: string;
  playcount?: number;
  // Similarity 0..1, similar-track results only.
  match?: number;
}

export interface LastFmArtist {
  name: string;
  playcount?: number;
  match?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toArray = (v: any): any[] => (Array.isArray(v) ? v : v ? [v] : []);
const artistName = (a: any): string => (typeof a === 'string' ? a : a?.name ?? a?.['#text'] ?? '');

class LastFm {
  static get enabled(): boolean {
    return !!Config.LASTFM_API_KEY && !!Config.LASTFM_API_SECRET;
  }

  static authUrl(callbackUrl: string): string {
    const params = new URLSearchParams({ api_key: Config.LASTFM_API_KEY, cb: callbackUrl });
    return `https://www.last.fm/api/auth/?${params}`;
  }

  // api_sig: MD5 of sorted <name><value> pairs (minus format/callback) + secret.
  private static sign(params: Record<string, string>): string {
    const base = Object.keys(params)
      .filter(k => k !== 'format' && k !== 'callback')
      .sort()
      .map(k => k + params[k])
      .join('');
    return crypto.createHash('md5').update(base + Config.LASTFM_API_SECRET, 'utf8').digest('hex');
  }

  private static async call(method: string, params: Record<string, string>, sessionKey?: string): Promise<any> {
    const all: Record<string, string> = { method, api_key: Config.LASTFM_API_KEY, ...params };
    if (sessionKey) all.sk = sessionKey;
    all.api_sig = this.sign(all);
    all.format = 'json';

    const result = await axios.get(API_URL, { params: all, timeout: 15000, validateStatus: () => true });
    if (result.data?.error) {
      throw new Error(`[LastFm] ${method} failed: ${result.data.message} (error ${result.data.error})`);
    }
    if (result.status >= 400) throw new Error(`[LastFm] ${method} failed with HTTP ${result.status}`);
    return result.data;
  }

  static async getSession(token: string): Promise<LastFmSession> {
    const data = await this.call('auth.getSession', { token });
    const { name, key } = data.session ?? {};
    if (!name || !key) throw new Error('[LastFm] auth.getSession returned no session');
    return { name, key };
  }

  static async getTopTracks(s: LastFmSession, period: LastFmPeriod, limit: number): Promise<LastFmTrack[]> {
    const data = await this.call('user.getTopTracks', { user: s.name, period, limit: String(limit) }, s.key);
    return toArray(data.toptracks?.track).map(t => ({
      artist: artistName(t.artist),
      title: t.name,
      playcount: Number(t.playcount) || 0,
    }));
  }

  static async getRecentTracks(s: LastFmSession, limit: number): Promise<LastFmTrack[]> {
    const data = await this.call('user.getRecentTracks', { user: s.name, limit: String(limit) }, s.key);
    return toArray(data.recenttracks?.track).map(t => ({ artist: artistName(t.artist), title: t.name }));
  }

  static async getTopArtists(s: LastFmSession, period: LastFmPeriod, limit: number): Promise<LastFmArtist[]> {
    const data = await this.call('user.getTopArtists', { user: s.name, period, limit: String(limit) }, s.key);
    return toArray(data.topartists?.artist).map(a => ({ name: a.name, playcount: Number(a.playcount) || 0 }));
  }

  static async getSimilarTracks(artist: string, title: string, limit: number): Promise<LastFmTrack[]> {
    const data = await this.call('track.getSimilar', { artist, track: title, limit: String(limit), autocorrect: '1' });
    return toArray(data.similartracks?.track).map(t => ({
      artist: artistName(t.artist),
      title: t.name,
      match: Number(t.match) || 0,
    }));
  }

  static async getSimilarArtists(artist: string, limit: number): Promise<LastFmArtist[]> {
    const data = await this.call('artist.getSimilar', { artist, limit: String(limit), autocorrect: '1' });
    return toArray(data.similarartists?.artist).map(a => ({ name: a.name, match: Number(a.match) || 0 }));
  }
}

export default LastFm;
