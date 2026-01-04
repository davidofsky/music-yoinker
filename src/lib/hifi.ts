/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { Album, Artist, Track } from './interfaces';

class Hifi {
  private static readonly DEFAULT_HEADERS = { accept: 'application/vnd.api+json' };
  private static maxRetries = 3;
  private static retryDelay = 2000; // 2 seconds between retries
  private static hifiSource = 0;

  private static getHifiSources(): string[] {
    return (process.env.HIFI_SOURCES || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async retryWithSourceCycle<T>(
    operation: (sourceUrl: string) => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const sources = this.getHifiSources();
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
      const result = await axios.get(`${sourceUrl}/search/`, {
        headers: this.DEFAULT_HEADERS,
        params: { al: query }
      });

      const items = result.data.data?.albums?.items || [];
      const albums = await Promise.all(items.map((album: any) => this.parseAlbum(album)));
      return this.removeDoubleAlbums(albums.filter(Boolean) as Album[]);
    }, 'SearchAlbum');
  }

  public static async searchArtist(query: string): Promise<Artist[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search/`, {
        headers: this.DEFAULT_HEADERS,
        params: { a: query }
      });

      const items = result.data.data?.artists?.items || [];
      return items.map((artist: any) => {
        const picture = artist.picture ? `https://resources.tidal.com/images/${artist.picture.replaceAll('-', '/')}/750x750.jpg` : '/david.jpeg';
        return { id: artist.id, name: artist.name, picture } as Artist;
      });
    }, 'SearchArtist');
  }

  public static async searchTrack(query: string): Promise<Track[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search/`, {
        headers: this.DEFAULT_HEADERS,
        params: { s: query }
      });

      const items = result.data.data?.items || [];
      const tracks = await Promise.all(items.map((t: any) => this.parseTrack(t)));
      return tracks.filter(Boolean) as Track[];
    }, 'SearchTrack');
  }

  public static async downloadTrack(id: string): Promise<string> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/track/`, {
        params: {
          id,
          quality: "LOSSLESS"
        },
        timeout: 30000
      });
      const manifest: any = JSON.parse(atob(result.data.data.manifest));
      return manifest.urls[0];
    }, 'DownloadTrack');
  }

  public static async downloadAlbum(id: string): Promise<Album> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/album/`, {
        headers: this.DEFAULT_HEADERS,
        params: { id }
      });
      console.log(result.data.data)

      return this.parseAlbum(result.data.data);
    }, 'DownloadAlbum');
  }

  public static async searchArtistAlbums(id: string): Promise<Album[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/artist/`, {
        headers: this.DEFAULT_HEADERS,
        params: { f: id }
      });

      const data = result.data.albums?.rows?.[0]?.modules?.find((m: any) => m.type === 'ALBUM_LIST');
      const items = data?.pagedList?.items || [];
      const albums = await Promise.all(items.map((album: any) => this.parseAlbum(album)));
      return this.removeDoubleAlbums(albums.filter(Boolean) as Album[]);
    }, 'SearchArtistAlbums');
  }

  public static async searchAlbumTracks(id: string): Promise<Track[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/album/`, {
        headers: this.DEFAULT_HEADERS,
        params: { id }
      });

      const items = result.data.data?.items || [];
      const tracks = await Promise.all(items.map((t: any) => this.parseTrack(t.item)));
      return tracks.filter(Boolean).sort((a, b) => a.volumeNr - b.volumeNr || a.trackNr - b.trackNr);
    }, 'SearchAlbumTracks');
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
      album: this.parseAlbum(track.album),
      artist: track?.artist?.name || track?.artist,
      copyright: track?.copyright,
      artwork: track?.album?.cover ? `https://resources.tidal.com/images/${track.album.cover.replaceAll('-', '/')}/640x640.jpg` : undefined
    } as Track;
  }

  private static removeDoubleAlbums(albums: Album[]): Album[] {
    const map = new Map<string, Album>();

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
}

export default Hifi;
