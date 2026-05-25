import axios from 'axios';
import Config from './config';
import { ITrack } from '@/app/interfaces/track.interface';
import { IAlbum } from '@/app/interfaces/album.interface';
import { IArtist } from '@/app/interfaces/artist.interface';
import { DownloadTrackSource } from './hifi';

interface QobuzImage {
  small?: string;
  thumbnail?: string;
  large?: string;
  back?: string | null;
}

interface QobuzArtistImage {
  small?: string;
  medium?: string;
  large?: string;
  extralarge?: string;
  mega?: string;
}

interface QobuzAlbum {
  id: number;
  title: string;
  version?: string | null;
  duration: number;
  tracks_count: number;
  release_date_original: string;
  image: QobuzImage;
  artist: { id: number; name: string };
  artists?: Array<{ id: number; name: string; roles?: string[] }>;
  upc?: string;
  parental_warning: boolean;
  streamable: boolean;
  hires?: boolean;
  copyright?: string;
}

interface QobuzTrack {
  id: number;
  title: string;
  version?: string | null;
  duration: number;
  track_number: number;
  media_number: number;
  isrc?: string;
  copyright?: string;
  parental_warning: boolean;
  streamable: boolean;
  hires?: boolean;
  performer: { id: number; name: string };
  album: QobuzAlbum;
}

interface QobuzArtist {
  id: number;
  name: string;
  image: QobuzArtistImage | null;
}

interface QobuzSearchResults {
  albums?: { items: QobuzAlbum[] };
  tracks?: { items: QobuzTrack[] };
  artists?: { items: QobuzArtist[] };
}

interface FetchedQobuzAlbum extends QobuzAlbum {
  tracks: { items: QobuzTrack[] };
}

interface QobuzReleasesResult {
  items: QobuzAlbum[];
}

class QobuzDl {
  private static maxRetries = 3;
  private static retryDelayInMs = 2000;
  private static qobuzSource = 0;

  private static getHeaders(): Record<string, string> {
    const cookies = Config.QOBUZ_DL_COOKIES;
    const now = Date.now();
    return { 'Cookie': cookies || `captcha_verified_at=${now}; download_captcha_verified_at=${now}` };
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async retryWithSourceCycle<T>(
    operation: (sourceUrl: string) => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const sources = Config.QOBUZ_DL_SOURCES;
    if (sources.length === 0) throw new Error(`[${operationName}] No Qobuz-DL sources configured`);
    const totalAttempts = sources.length * this.maxRetries;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const currentSource = sources[this.qobuzSource % sources.length];
      try {
        logger.info(`[${operationName}] Attempt ${attempt + 1}/${totalAttempts} using source: ${currentSource}`);
        return await operation(currentSource);
      } catch (error) {
        lastError = error;
        const axiosBody = (error as { response?: { data?: unknown } })?.response?.data;
        const reason = axiosBody ? JSON.stringify(axiosBody) : (error as Error)?.message;
        logger.error(`[${operationName}] Failed with source ${currentSource}: ${reason}`);
        this.qobuzSource = (this.qobuzSource + 1) % sources.length;
        if (attempt < totalAttempts - 1) {
          await this.sleep(this.retryDelayInMs);
        }
      }
    }
    throw new Error(`[${operationName}] All ${totalAttempts} attempts failed. Last error: ${(lastError as Error)?.message ?? String(lastError)}`);
  }

  public static async searchAlbum(query: string): Promise<IAlbum[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get<{ success: boolean; data: QobuzSearchResults }>(`${sourceUrl}/api/get-music`, {
        params: { q: query },
        headers: this.getHeaders()
      });
      return (result.data.data?.albums?.items || []).map(a => this.mapAlbum(a));
    }, 'QobuzSearchAlbum');
  }

  public static async searchArtist(query: string): Promise<IArtist[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get<{ success: boolean; data: QobuzSearchResults }>(`${sourceUrl}/api/get-music`, {
        params: { q: query },
        headers: this.getHeaders()
      });
      return (result.data.data?.artists?.items || []).map(a => this.mapArtist(a));
    }, 'QobuzSearchArtist');
  }

  public static async searchTrack(query: string): Promise<ITrack[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get<{ success: boolean; data: QobuzSearchResults }>(`${sourceUrl}/api/get-music`, {
        params: { q: query },
        headers: this.getHeaders()
      });
      return (result.data.data?.tracks?.items || []).map(t => this.mapTrack(t));
    }, 'QobuzSearchTrack');
  }

  public static async searchAlbumTracks(id: string): Promise<ITrack[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get<{ success: boolean; data: FetchedQobuzAlbum }>(`${sourceUrl}/api/get-album`, {
        params: { album_id: id },
        headers: this.getHeaders()
      });
      const album = result.data.data;
      return (album?.tracks?.items || [])
        .map(t => this.mapTrack(t, album))
        .sort((a, b) => a.volumeNumber - b.volumeNumber || a.trackNumber - b.trackNumber);
    }, 'QobuzSearchAlbumTracks');
  }

  public static async searchArtistAlbums(id: string): Promise<IAlbum[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get<{ success: boolean; data: QobuzReleasesResult }>(`${sourceUrl}/api/get-releases`, {
        params: { artist_id: id, release_type: 'album', limit: 500 },
        headers: this.getHeaders()
      });
      return (result.data.data?.items || []).map(a => this.mapAlbum(a));
    }, 'QobuzSearchArtistAlbums');
  }

  public static async downloadTrack(id: string): Promise<DownloadTrackSource> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get<{ success: boolean; data: { url: string } }>(`${sourceUrl}/api/download-music`, {
        params: { track_id: id, quality: Config.QOBUZ_DL_QUALITY },
        headers: this.getHeaders(),
        timeout: 30000
      });
      const url = result.data.data?.url;
      if (!url) throw new Error('[QobuzDownloadTrack] No URL returned from server');
      return {
        type: 'direct' as const,
        url,
        extension: '.flac',
        fetchHeaders: {
          'Origin': sourceUrl,
          'Referer': `${sourceUrl}/`,
        }
      };
    }, 'QobuzDownloadTrack');
  }

  private static mapAlbum(a: QobuzAlbum): IAlbum {
    const artwork = a.image?.large || a.image?.small || '';
    const rawArtists = a.artists?.length
      ? a.artists.map(ar => ({ id: ar.id, name: ar.name, handle: null, type: 'MAIN', picture: '' }))
      : [{ id: a.artist.id, name: a.artist.name, handle: null, type: 'MAIN', picture: '' }];

    return {
      id: a.id,
      title: a.title,
      cover: '',
      vibrantColor: '',
      videoCover: null,
      artwork,
      isDownloaded: false,
      source: 'qobuz',
      duration: a.duration || 0,
      streamReady: a.streamable,
      payToStream: false,
      adSupportedStreamReady: false,
      djReady: false,
      stemReady: false,
      streamStartDate: '',
      allowStreaming: a.streamable,
      premiumStreamingOnly: false,
      numberOfTracks: a.tracks_count || 0,
      numberOfVideos: 0,
      numberOfVolumes: 1,
      releaseDate: a.release_date_original || '',
      copyright: a.copyright || '',
      type: 'ALBUM',
      version: null,
      url: '',
      explicit: a.parental_warning,
      upc: a.upc || '',
      popularity: 0,
      audioQuality: a.hires ? 'HI_RES' : 'LOSSLESS',
      audioModes: [],
      mediaMetadata: { tags: [] },
      upload: false,
      artists: rawArtists,
    };
  }

  private static mapTrack(t: QobuzTrack, parentAlbum?: QobuzAlbum): ITrack {
    const image = t.album?.image ?? parentAlbum?.image;
    const artwork = image?.large || image?.small || '';
    const albumTitle = t.album?.title || parentAlbum?.title || '';
    const albumId = t.album?.id || parentAlbum?.id || 0;
    const albumArtist = parentAlbum?.artist?.name || t.performer?.name || '';
    const releaseDate = parentAlbum?.release_date_original || '';
    return {
      id: t.id,
      title: t.title,
      duration: t.duration || 0,
      trackNumber: t.track_number,
      volumeNumber: t.media_number || 1,
      version: t.version || null,
      copyright: t.copyright || t.album?.copyright || parentAlbum?.copyright || '',
      isrc: t.isrc || '',
      explicit: t.parental_warning,
      audioQuality: (t.hires || parentAlbum?.hires) ? 'HI_RES' : 'LOSSLESS',
      artist: {
        id: t.performer?.id || 0,
        name: t.performer?.name || albumArtist,
        handle: null,
        type: 'MAIN',
        picture: '',
      },
      artists: [{
        id: t.performer?.id || 0,
        name: t.performer?.name || albumArtist,
        handle: null,
        type: 'MAIN',
        picture: '',
      }],
      album: {
        id: albumId,
        title: albumTitle,
        cover: '',
        vibrantColor: '',
        videoCover: null,
      },
      releaseDate,
      artwork,
      isDownloaded: false,
      source: 'qobuz',
      replayGain: 0,
      peak: 0,
      allowStreaming: t.streamable,
      streamReady: t.streamable,
      payToStream: false,
      adSupportedStreamReady: false,
      djReady: false,
      stemReady: false,
      streamStartDate: '',
      premiumStreamingOnly: false,
      popularity: 0,
      bpm: 0,
      key: '',
      keyScale: null,
      url: '',
      editable: false,
      audioModes: [],
      mediaMetadata: { tags: [] },
      upload: false,
      accessType: null,
      spotlighted: false,
      mixes: { TRACK_MIX: '' },
    };
  }

  private static mapArtist(a: QobuzArtist): IArtist {
    return {
      id: a.id,
      name: a.name,
      handle: null,
      type: 'MAIN',
      picture: a.image?.large || a.image?.extralarge || a.image?.medium || '/david.jpeg',
      source: 'qobuz',
      artistTypes: [],
      url: '',
      selectedAlbumCoverFallback: null,
      popularity: 0,
      artistRoles: [],
      mixes: { ARTIST_MIX: '' },
      userId: null,
      spotlighted: false,
    };
  }
}

export default QobuzDl;
