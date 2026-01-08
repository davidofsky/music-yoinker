class Config {
  static get BACKEND_PORT(): number {
    return validateNumber(process.env.BACKEND_PORT, 3000);
  }

  static get FRONTEND_PORT(): number {
    return validateNumber(process.env.FRONTEND_PORT, 8080);
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

  static get MUSIC_DIRECTORY(): string {
    return process.env.MUSIC_DIRECTORY || '';
  }

  static get HOST_MUSIC_DIRECTORY(): string {
    return process.env.HOST_MUSIC_DIRECTORY || '';
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

function validateNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const port = parseInt(value, 10);
  return Number.isFinite(port) && port > 0 ? port : defaultValue;
}

export default Config;
