import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });

// Public (publishable) Supabase anon key served in arcod.xyz's own frontend bundle: it
// identifies the project, not a user. Only needed for another instance or a rotation.
const ARCOD_SUPABASE_URL = 'https://fnlghyzwyoklfqyhqlav.supabase.co';
const ARCOD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZubGdoeXp3eW9rbGZxeWhxbGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDExODAsImV4cCI6MjA4OTY3NzE4MH0.9J1-JK1jJYunBM6bF-_MLR5UvhDV4BibXordTOzH2_0';

class Config {

  static get LOG_LEVEL(): string {
    return process.env.LOG_LEVEL || 'info';
  }

  static get TIDAL_CLIENT_ID(): string {
    return process.env.TIDAL_CLIENT_ID || '';
  }

  static get TIDAL_CLIENT_SECRET(): string {
    return process.env.TIDAL_CLIENT_SECRET || '';
  }

  static get HIFI_SOURCES(): string[] {
    return (process.env.HIFI_SOURCES || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  static get QOBUZ_DL_SOURCES(): string[] {
    return (process.env.QOBUZ_DL_SOURCES || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  static get QOBUZ_DL_COOKIES(): string {
    return process.env.QOBUZ_DL_COOKIES || '';
  }

  static get QOBUZ_DL_QUALITY(): string {
    const q = process.env.QOBUZ_DL_QUALITY || '27';
    return ['27', '7', '6', '5'].includes(q) ? q : '27';
  }

  static get QOBUZ_DL_EMAIL(): string {
    return process.env.QOBUZ_DL_EMAIL || '';
  }

  static get QOBUZ_DL_PASSWORD(): string {
    return process.env.QOBUZ_DL_PASSWORD || '';
  }

  static get QOBUZ_DL_SUPABASE_URL(): string {
    return process.env.QOBUZ_DL_SUPABASE_URL || ARCOD_SUPABASE_URL;
  }

  static get QOBUZ_DL_SUPABASE_KEY(): string {
    return process.env.QOBUZ_DL_SUPABASE_KEY || ARCOD_SUPABASE_ANON_KEY;
  }

  static get LUCIDA_API_URL(): string {
    return process.env.LUCIDA_API_URL || '';
  }

  static get MUSIC_DIRECTORY(): string {
    return process.env.MUSIC_DIRECTORY || '';
  }

  static get DATA_DIRECTORY(): string {
    return process.env.DATA_DIRECTORY || '';
  }

  static get CLEAN_EXISTING_DOWNLOADS(): boolean {
    return (process.env.CLEAN_EXISTING_DOWNLOADS || 'false').toLowerCase() === 'true';
  }

  static get CLEAN_EXISTING_DOWNLOADS_TTL_MS(): number {
    const configuredSeconds = process.env.CLEAN_EXISTING_DOWNLOADS_TTL_SECONDS;
    const seconds = configuredSeconds ? parseInt(configuredSeconds, 10) : 3600;
    return (isNaN(seconds) ? 3600 : seconds) * 1000;
  }

  static get TRACK_DISC_SEPARATOR(): string {
    const raw = process.env.TRACK_DISC_SEPARATOR;
    if (!raw) return '.';

    let value = raw;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }

  static get TRACK_PAD_LENGTH(): number {
    const raw = process.env.TRACK_PAD_LENGTH ?? '0';
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 2;
  }

  static get DOWNLOAD_MAX_RETRIES(): number {
    const n = parseInt(process.env.DOWNLOAD_MAX_RETRIES ?? '', 10);
    return Number.isFinite(n) && n > 0 ? n : 3;
  }

  static get TRACK_TITLE_SEPARATOR(): string {
    const raw = process.env.TRACK_TITLE_SEPARATOR;
    if (!raw) return ' - ';

    let value = raw;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }
}

export default Config;