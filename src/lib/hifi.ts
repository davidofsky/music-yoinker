/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { Album, Artist, Track } from './interfaces';

class Hifi {
  private static readonly DEFAULT_HEADERS = { accept: 'application/vnd.api+json' };
  private static maxRetries = 3;
  private static retryDelay = 2000; // 2 seconds between retries
  private static hifiSource = 0;

  /**
   * SEARCH_SOURCES:
   *  - Way faster
   *  - Only suitable for searching
   * DOWNLOAD_SOURCES:
   *  - More reliable
   *  - Suitable for both searching and downloading
   */
  private static getHifiSources(type: 'search' | 'download'): string[] {
    const searchSources = (process.env.SEARCH_SOURCES || '').split(',').map(s => s.trim()).filter(Boolean);
    const downloadSources = (process.env.DOWNLOAD_SOURCES || '').split(',').map(s => s.trim()).filter(Boolean);

    if (type === 'search') return [...searchSources, ...downloadSources];
    return downloadSources;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getNextSource(sources: string[]): number {
    return (this.hifiSource + 1) % sources.length;
  }

  private static async retryWithSourceCycle<T>(
    operation: (sourceUrl: string) => Promise<T>,
    operationName: string,
    sourceType: 'search' | 'download'
  ): Promise<T> {
    const sources = this.getHifiSources(sourceType);
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
          await this.sleep(this.retryDelay);
        }
      }
    }

    throw new Error(`[${operationName}] All ${totalAttempts} attempts failed. Last error: ${lastError?.message ?? String(lastError)}`);
  }

  public static async searchAlbum(query: string): Promise<Album[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search`, {
        headers: this.DEFAULT_HEADERS,
        params: { al: query }
      });

      const items = result.data?.albums?.items || [];
      const albums = await Promise.all(items.map((album: any) => this.parseAlbum(album)));
      return albums.filter(Boolean) as Album[];
    }, 'SearchAlbum', 'search');
  }
  public static async searchArtist(query: string) : Promise<Artist[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search`, {
        headers: this.DEFAULT_HEADERS,
        params: { a: query }
      });

      const items = result.data?.[0]?.artists?.items || [];
      return items.map((artist: any) => {
        const picture = artist.picture ? `https://resources.tidal.com/images/${artist.picture.replaceAll('-', '/')}/750x750.jpg` : '/david.jpeg';
        return { id: artist.id, name: artist.name, picture } as Artist;
      });
    }, 'SearchArtist', 'search');
  }

  public static async searchTrack(query: string): Promise<Track[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search`, {
        headers: this.DEFAULT_HEADERS,
        params: { s: query }
      });

      const items = result.data?.items || [];
      const tracks = await Promise.all(items.map((t: any) => this.parseTrack(t)));
      return tracks.filter(Boolean) as Track[];
    }, 'SearchTrack', 'search');
  }

  public static async downloadTrack(id: string): Promise<string> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/track`, {
        params: {
          id,
          quality: "LOSSLESS"
        },
        timeout: 30000
      });
      return result.data[2].OriginalTrackUrl;
    }, 'DownloadTrack', 'download');
  }

  public static async downloadAlbum(id: string): Promise<Album> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/album`, {
        headers: this.DEFAULT_HEADERS,
        params: { id }
      });

      return this.parseAlbum(result.data?.[0]);
    }, 'DownloadAlbum', 'download');
  }

  public static async searchArtistAlbums(id: string) : Promise<Album[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/artist`, {
        headers: this.DEFAULT_HEADERS,
        params: { f: id }
      });

      const data = result.data?.[0]?.rows?.[0]?.modules?.find((m: any) => m.type === 'ALBUM_LIST');
      const items = data?.pagedList?.items || [];
      const albums = await Promise.all(items.map((album: any) => this.parseAlbum(album)));
      return albums.filter(Boolean) as Album[];
    }, 'SearchArtistAlbums', 'search');
  }

  public static async searchAlbumTracks(id: string): Promise<Track[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/album`, {
        headers: this.DEFAULT_HEADERS,
        params: { id }
      });

      const items = result.data?.[1]?.items || [];
      const tracks = await Promise.all(items.map((t: any) => this.parseTrack(t.item)));
      return tracks.filter(Boolean).sort((a, b) => a.volumeNr - b.volumeNr || a.trackNr - b.trackNr);
    }, 'SearchAlbumTracks', 'search');
  }

  private static parseAlbum(album: any): Album {
    const tidalArtists = album?.artists || [];
    const artists: Artist[] = tidalArtists.map((t: any) => ({ id: t.id, name: t.name }));
    return {
      id: album?.id,
      title: album?.title,
      releaseDate: album?.releaseDate,
      artists,
      artwork: album?.cover ? `https://resources.tidal.com/images/${album.cover.replaceAll('-', '/')}/640x640.jpg` : undefined,
      color: album?.vibrantColor
    } as Album;
  }

  private static parseTrack(track: any): Track {
    return {
      id: track?.id,
      title: track?.title,
      volumeNr: track?.volumeNumber || track?.volumeNr || 0,
      trackNr: track?.trackNumber || track?.trackNr || 0,
      duration: track?.duration,
      popularity: track?.popularity,
      bpm: track?.bpm,
      key: track?.key,
      keyScale: track?.keyScale,
      isrc: track?.isrc,
      explicit: track?.explicit,
      type: 'album',
      version: track?.version || '',
      album: track?.album?.title || track?.album,
      album_id: track?.album?.id || track?.album_id,
      artist: track?.artist?.name || track?.artist,
      copyright: track?.copyright,
      artwork: track?.album?.cover ? `https://resources.tidal.com/images/${track.album.cover.replaceAll('-', '/')}/640x640.jpg` : undefined
    } as Track;
  }
}

export default Hifi;
