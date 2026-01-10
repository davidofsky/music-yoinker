/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import Config from './config';
import { ITrack } from '@/app/interfaces/track.interface';
import { IAlbum } from '@/app/interfaces/album.interface';
import { IArtist } from '@/app/interfaces/artist.interface';

export type DownloadTrackSource =
  | { type: 'direct'; url: string; mimeType?: string | null }
  | { type: 'dash'; mimeType?: string | null; initUrl: string; segmentUrls: string[]; extension: string };

class Hifi {
  private static readonly DEFAULT_HEADERS = { accept: 'application/vnd.api+json' };
  private static maxRetries = 3;
  private static retryDelayInMs = 2000;
  private static hifiSource = 0;

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async retryWithSourceCycle<T>(
    operation: (sourceUrl: string) => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const sources = Config.HIFI_SOURCES;
    const totalAttempts = sources.length * this.maxRetries;
    let lastError: any = null;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const currentSource = sources[this.hifiSource % sources.length];
      try {
        console.log(`[${operationName}] Attempt ${attempt + 1}/${totalAttempts} using source: ${currentSource}`);
        return await operation(currentSource);
      } catch (error) {
        lastError = error;
        console.error(`[${operationName}] Failed with source ${currentSource}:`, (error as Error)?.message ?? error);

        // Move to next source
        this.hifiSource = (this.hifiSource + 1) % sources.length;

        if (attempt < totalAttempts - 1) {
          await this.sleep(this.retryDelayInMs);
        }
      }
    }
    throw new Error(`[${operationName}] All ${totalAttempts} attempts failed. Last error: ${lastError?.message ?? String(lastError)}`);
  }

  public static async searchAlbum(query: string): Promise<IAlbum[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search/`, {
        headers: this.DEFAULT_HEADERS,
        params: { al: query }
      });

      const albums: IAlbum[] = result.data.data?.albums?.items || [];

      return this.parseAlbums(albums);
    }, 'SearchAlbum');
  }

  public static async searchArtistAlbums(id: string): Promise<IAlbum[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/artist/`, {
        headers: this.DEFAULT_HEADERS,
        params: { f: id }
      });

      const allResults: IAlbum[] = result.data.albums.items || [];
      const albums = allResults.filter((album) => album.type === 'ALBUM');

      return this.parseAlbums(albums);
    }, 'SearchArtistAlbums');
  }

  public static async searchArtist(query: string): Promise<IArtist[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search/`, {
        headers: this.DEFAULT_HEADERS,
        params: { a: query }
      });

      const artists: IArtist[] = result.data.data?.artists?.items || [];
      artists.forEach((artist) => {
        artist.picture = artist.picture ? `https://resources.tidal.com/images/${artist.picture.replaceAll('-', '/')}/750x750.jpg` : '/david.jpeg';
      });

      return artists.filter(Boolean);
    }, 'SearchArtist');
  }

  public static async searchTrack(query: string): Promise<ITrack[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search/`, {
        headers: this.DEFAULT_HEADERS,
        params: { s: query }
      });

      const tracks: ITrack[] = result.data.data?.items || [];
      tracks.forEach((track) => {
        track.artwork = track.album.cover ? `https://resources.tidal.com/images/${track.album.cover.replaceAll('-', '/')}/640x640.jpg` : '/david.jpeg';
      });

      return tracks.filter(Boolean);
    }, 'SearchTrack');
  }

  public static async downloadTrack(id: string): Promise<DownloadTrackSource> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/track/`, {
        headers: this.DEFAULT_HEADERS,
        params: {
          id,
          quality: "LOSSLESS"
        },
        timeout: 30000
      });

      const { manifestMimeType, manifest, assetPresentation } = result.data.data;
      if (assetPresentation !== 'FULL') {
        throw new Error(`[DownloadTrack] Asset presentation is not FULL: ${assetPresentation}`);
      }

      const decodedManifest = manifest ? atob(manifest) : '';

      if (!decodedManifest) {
        throw new Error('[DownloadTrack] Empty manifest received from server');
      } else if (manifestMimeType === 'application/vnd.tidal.bts') {
        const parsed = JSON.parse(decodedManifest);
        const url = parsed?.urls?.[0];
        return { type: 'direct', url, mimeType: manifestMimeType };
      } else if (manifestMimeType === 'application/dash+xml') {
        return this.parseDashManifest(decodedManifest, manifestMimeType);
      } else {
        throw new Error(`[DownloadTrack] Unsupported manifest mime type: ${manifestMimeType}`);
      }
    }, 'DownloadTrack');
  }

  private static parseDashManifest(manifestXml: string, manifestMimeType?: string | null): DownloadTrackSource {
    const initMatch = manifestXml.match(/initialization="([^"]+)"/i);
    const mediaMatch = manifestXml.match(/media="([^"]+)"/i);
    if (!initMatch || !mediaMatch) {
      throw new Error('[DownloadTrack] DASH manifest missing initialization or media template');
    }

    const initUrl = initMatch[1].replace(/&amp;/g, '&');
    const mediaTemplate = mediaMatch[1].replace(/&amp;/g, '&');
    const startNumber = Number(manifestXml.match(/startNumber="(\d+)"/i)?.[1] || '1');

    const timelineMatches = Array.from(manifestXml.matchAll(/<S[^>]*d="(\d+)"(?:[^>]*r="(-?\d+)")?[^>]*>/gi));
    const segmentUrls: string[] = [];
    let segmentIndex = startNumber;

    for (const match of timelineMatches) {
      const repeat = Number(match[2] ?? '0');
      const count = 1 + (Number.isFinite(repeat) ? repeat : 0);
      for (let i = 0; i < count; i++) {
        segmentUrls.push(mediaTemplate.replace('$Number$', String(segmentIndex++)));
      }
    }

    if (segmentUrls.length === 0) {
      segmentUrls.push(mediaTemplate.replace('$Number$', String(segmentIndex)));
    }

    const templateExtMatch = mediaTemplate.match(/\.([a-z0-9]+)(?:\?|$)/i);
    const codecs = manifestXml.match(/codecs="([^"]+)"/i)?.[1]?.toLowerCase() ?? '';
    const extension = templateExtMatch
      ? `.${templateExtMatch[1]}`
      : (codecs.includes('flac') ? '.flac' : '.mp4');

    return {
      type: 'dash',
      mimeType: manifestMimeType,
      initUrl,
      segmentUrls,
      extension
    };
  }

  public static async downloadAlbum(id: string): Promise<IAlbum> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/album/`, {
        headers: this.DEFAULT_HEADERS,
        params: { id }
      });
      console.log(result.data.data)

      return result.data.data;
    }, 'DownloadAlbum');
  }

  public static async searchAlbumTracks(id: string): Promise<ITrack[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/album/`, {
        headers: this.DEFAULT_HEADERS,
        params: { id }
      });

      const embeddedTracks: { item: ITrack }[] = result.data.data.items || [];
      const tracks: ITrack[] = embeddedTracks.map(et => { return et.item; });
      return tracks.filter(Boolean).sort((a, b) => a.volumeNumber - b.volumeNumber || a.trackNumber - b.trackNumber);
    }, 'SearchAlbumTracks');
  }

  private static removeDoubleAlbums(albums: IAlbum[]): IAlbum[] {
    const map = new Map<string, IAlbum>();

    for (const a of albums) {
      const artistNames = (a.artists || []).map(ar => (ar.name || ar.id || '').toString().toLowerCase()).sort().join('|');
      const title = (a.title || '').toString().toLowerCase().trim().split(/\s+/).join(' ');
      let year = '';

      if (a.releaseDate) {
        const d = new Date(a.releaseDate);
        const t = d.getTime();
        if (Number.isFinite(t)) year = String(d.getFullYear());
        else year = String(a.releaseDate).trim();
      }

      const key = `${artistNames}::${title}::${year}`;
      if (!map.has(key)) map.set(key, a);
    }

    console.log(`[RemoveDoubleAlbums] Reduced from ${albums.length} to ${map.size} albums.`);

    return Array.from(map.values());
  }

  private static parseAlbums(albums: IAlbum[]): IAlbum[] {
    albums.forEach((album: IAlbum) => {
      album.artwork = album.cover ? `https://resources.tidal.com/images/${album.cover.replaceAll('-', '/')}/640x640.jpg` : '';
    });
    return this.removeDoubleAlbums(albums.filter(Boolean));
  }
}

export default Hifi;
