import axios from 'axios';
import { Album, Artist, Track } from './interfaces';

class Hifi {
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
    const searchSources = (process.env.SEARCH_SOURCES || "").split(',');
    const downloadSources = (process.env.DOWNLOAD_SOURCES || "").split(',');

    if (type === 'search') {
      return searchSources.concat(downloadSources);
    } else if (type === 'download') {
      return downloadSources;
    } else {
      return [];
    }
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
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const currentSource = sources[this.hifiSource];

      try {
        console.log(`[${operationName}] Attempt ${attempt + 1}/${totalAttempts} using source: ${currentSource}`);
        return await operation(currentSource);
      } catch (error) {
        lastError = error as Error;
        console.error(`[${operationName}] Failed with source ${currentSource}:`, (error as Error)?.message);

        // Move to next source
        this.hifiSource = this.getNextSource(sources);

        // Sleep before retry (except on last attempt)
        if (attempt < totalAttempts - 1) {
          await this.sleep(this.retryDelay);
        }
      }
    }

    throw new Error(`[${operationName}] All ${totalAttempts} attempts failed. Last error: ${lastError?.message}`);
  }

  public static async searchAlbum(query: string): Promise<Album[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search`, {
        headers: {
          "accept": "application/vnd.api+json",
        },
        params: {
          "al": query
        }
      });

      const albums: Album[] = [];
      if (result.data.albums?.items) {
        result.data.albums.items.forEach((album) => {
          this.parseAlbum(album).then(a => {
            albums.push(a)
          })
        });
      }
      return albums;
    }, 'SearchAlbum', 'search');
  }
  public static async searchArtist(query: string) : Promise<Artist[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search`, {
        headers: {
          "accept": "application/vnd.api+json",
        },
        params: {
          "a": query
        }
      });

      const artists: Artist[] = [];
      result.data[0].artists.items.forEach(artist => {
        const picture = artist.picture ? "https://resources.tidal.com/images/" + artist.picture.replaceAll('-', '/') + "/750x750.jpg" : "/david.jpeg"
        artists.push({
          id: artist.id,
          name: artist.name,
          picture
        })
      })
      return artists
    }, 'SearchArtist', 'search');
  }

  public static async searchTrack(query: string): Promise<Track[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/search`, {
        headers: {
          "accept": "application/vnd.api+json",
        },
        params: {
          "s": query
        }
      });

      const tracks: Track[] = [];
      result.data.items.forEach(track => {
        this.parseTrack(track).then(t => { tracks.push(t) })
      })
      return tracks
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
        headers: {
          "accept": "application/vnd.api+json",
        },
        params: {
          "id": id
        }
      });

      return await this.parseAlbum(result.data[0])
    }, 'DownloadAlbum', 'download');
  }

  public static async searchArtistAlbums(id: string) : Promise<Album[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      console.debug(id)
      const result = await axios.get(`${sourceUrl}/artist`, {
        headers: {
          "accept": "application/vnd.api+json",
        },
        params: {
          "f": id
        }
      });

      const data = result.data[0].rows[0].modules.find(m=>m.type==="ALBUM_LIST")
      const albums: Album[] = [];
      data.pagedList.items.forEach(album => {
        this.parseAlbum(album).then(a => albums.push(a))
      })

      return albums;
    }, 'SearchArtistAlbums', 'search');
  }

  public static async searchAlbumTracks(id: string): Promise<Track[]> {
    return this.retryWithSourceCycle(async (sourceUrl) => {
      const result = await axios.get(`${sourceUrl}/album`, {
        headers: {
          "accept": "application/vnd.api+json",
        },
        params: {
          "id": id
        }
      });

      const tracks: Track[] = [];
      result.data[1]?.items?.forEach(track => {
        this.parseTrack(track.item).then(t => tracks.push(t))
      });

      return tracks.sort((a, b) => {
        return a.volumeNr - b.volumeNr || a.trackNr - b.trackNr;
      });
    }, 'SearchAlbumTracks', 'search');
  }


  private static async parseAlbum(album): Promise<Album> {
    const tidalArtists = album.artists;
    const artists: Artist[] = tidalArtists.map((t) => ({
      id: t.id,
      name: t.name
    }));
    return (<Album>{
      id: album.id,
      title: album.title,
      releaseDate: album.releaseDate,
      artists,
      artwork: "https://resources.tidal.com/images/" + album.cover.replaceAll('-', '/') + "/640x640.jpg",
      color: album.vibrantColor
    });
  }

  private static async parseTrack(track): Promise<Track> {
    return (<Track>{
      id: track.id,
      title: track.title,
      volumeNr: track.volumeNumber,
      trackNr: track.trackNumber,
      duration: track.duration,
      popularity: track.popularity,
      bpm: track.bpm,
      key: track.key,
      keyScale: track.keyScale,
      isrc: track.isrc,
      explicit: track.explicit,
      type: "album",
      version: track.version || "",
      album: track.album.title,
      album_id: track.album.id,
      artist: track.artist.name,
      copyright: track.copyright,
      artwork: "https://resources.tidal.com/images/" + track.album.cover.replaceAll('-', '/') + "/640x640.jpg"
    });
  }

}

export default Hifi;
