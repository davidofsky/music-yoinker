import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url).pathname });

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

  static get LUCIDA_API_URL(): string {
    return process.env.LUCIDA_API_URL || '';
  }

  /**
   * Lucida goes quiet while it rips a track — before the first byte, and again
   * whenever it re-rips to resume a dropped transfer. Since axios counts this
   * as socket idle time, the limit has to cover a whole rip, not a stalled
   * connection. lucida-api gives up on a rip after 5 minutes, so anything past
   * that plus a minute of margin only delays noticing a wedged download.
   */
  static get LUCIDA_DOWNLOAD_TIMEOUT_MS(): number {
    const n = parseInt(process.env.LUCIDA_DOWNLOAD_TIMEOUT_SECONDS ?? '', 10);
    return (Number.isFinite(n) && n > 0 ? n : 360) * 1000;
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

  static get DOWNLOAD_TIMEOUT_MS(): number {
    const n = parseInt(process.env.DOWNLOAD_TIMEOUT_SECONDS ?? '', 10);
    return (Number.isFinite(n) && n > 0 ? n : 60) * 1000;
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