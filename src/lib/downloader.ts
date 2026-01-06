import fs from 'fs';
import tmp from 'tmp';
import axios, { AxiosError } from "axios";
import path from 'path';
import { Track, Album } from "./interfaces";
import Tidal from "./tidal"
import { broadcastQueue } from '@/lib/broadcast';
import { PegTheFile } from './pegger';
import Hifi from './hifi'

class Downloader {
  private static get TRACK_DISC_SEPARATOR(): string {
    const raw = process.env.TRACK_DISC_SEPARATOR;
    if (!raw) return '.';

    let value = raw;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }
  private static get PAD_LENGTH(): number {
    const raw = process.env.TRACK_PAD_LENGTH ?? '0';
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 2;
  }
  private static get TRACK_TITLE_SEPARATOR(): string {
    const raw = process.env.TRACK_TITLE_SEPARATOR;
    if (!raw) return ' ';

    let value = raw;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }
  private static queue: Track[] = []
  private static processing: boolean = false;
  private static cleanedAlbumDirs: Map<string, number> = new Map();

  private static get CLEAN_EXISTING_DOWNLOADS(): boolean {
    return (process.env.CLEAN_EXISTING_DOWNLOADS || 'false').toLowerCase() === 'true';
  }
  private static get CLEAN_EXISTING_DOWNLOADS_TTL_MS(): number {
    const configuredSeconds = process.env.CLEAN_EXISTING_DOWNLOADS_TTL_SECONDS;
    const seconds = configuredSeconds ? parseInt(configuredSeconds, 10) : 3600;
    return (isNaN(seconds) ? 3600 : seconds) * 1000;
  }
  public static GetQueue = () => { return this.queue }

  public static async IsAlbumDownloaded(album: Album): Promise<boolean> {
    try {
      if (!album.artists || album.artists.length === 0) {
        return false;
      }

      const musicDir = process.env.MUSIC_DIRECTORY || "";
      const artistName = this.sanitizeFilename(album.artists[0].name);
      const albumTitle = this.sanitizeFilename(album.title);
      const albumDir = path.join(musicDir, artistName, albumTitle);

      if (!fs.existsSync(albumDir)) {
        return false;
      }

      const files = fs.readdirSync(albumDir);
      const hasAudioFiles = files.some(file => file.endsWith('.flac') || file.endsWith('.mp4') || file.endsWith('.mp3'));

      return hasAudioFiles;
    } catch (err) {
      console.error('[IsAlbumDownloaded] Error checking if album is downloaded:', err);
      return false;
    }
  }

  private static formatTrackNumber(value?: number | string) {
    if (!value) return '';
    const s = value.toString().trim();
    if (s === '') return '';
    return s.padStart(this.PAD_LENGTH, '0');
  }

  public static AddToQueue(tracks: Track[]) {
    this.queue.push(...tracks);
    broadcastQueue(this.queue);
    this.download().catch(err => {
      console.error("Queue processing error:", err);
    });
  }

  // Returns error message if exists
  public static RemoveFromQueue(trackId: string): string | null {
    console.log("removing track with id ", trackId)
    const index = this.queue.findIndex(q => q.id.toString() === trackId.toString());
    if (index === -1) return `Queue does not contain track with id: ${trackId}.`;
    if (index === 0) return `Track with id ${trackId} is currently being processed.`;
    this.queue.splice(index, 1);
    broadcastQueue(this.queue);
    return null
  }

  private static async download() {
    if (this.processing) return;
    if (!this.queue || this.queue.length === 0) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const track = this.queue[0];
        if (!track) {
          this.queue.shift();
          continue;
        }

        try {
          await this.downloadTrack(track);
        } catch (err) {
          console.error(`Error downloading track ${track.title}:`, err);
        }

        this.queue.shift();
        broadcastQueue(this.queue);
      }
    } finally {
      this.processing = false;
    }
  }


  private static async downloadTrack(track: Track) {
    let tmpFile: tmp.FileResult | null = null;

    try {
      console.info(`Downloading track: ${track.title}`);
      const blobUrl = await Hifi.downloadTrack(track.id);
      const tidalAlbum = Tidal.getAlbum(track.album.id);

      console.debug('retrieving blob', blobUrl)
      const response = await axios.get(blobUrl, {
        responseType: 'arraybuffer',
        timeout: 60000 // Longer timeout for actual download
      }).then((e) => { console.debug('retrieved blob'); return e; });

      const contentType = response.headers['content-type'];

      let extension = '.flac'
      if (contentType.includes('audio/mp4')) extension = '.mp4';
      else if (contentType.includes('audio/mp3')) extension = '.mp3';

      tmpFile = tmp.fileSync({ postfix: extension });
      const filePath = tmpFile.name;

      fs.writeFileSync(filePath, response.data);

      const version = (track.version && track.version.toString().trim() !== '') ? ` (${track.version.toString().trim()})` : '';
      const sanitizedTitle = this.sanitizeFilename(track.title);
      const volStr = this.formatTrackNumber(track.volumeNr);
      const trackStr = this.formatTrackNumber(track.trackNr);

      let prefix = '';
      if (volStr && trackStr) prefix = `${volStr}${this.TRACK_DISC_SEPARATOR}${trackStr}`;
      else if (trackStr) prefix = `${trackStr}`;
      else if (volStr) prefix = `${volStr}`;

      console.debug("Using track prefix:", prefix === '' ? '(none)' : `"${prefix}"`);
      console.debug("Using track title separator:", `"${this.TRACK_TITLE_SEPARATOR}"`);
      const titleJoin = prefix ? this.TRACK_TITLE_SEPARATOR : '';
      const fileName = `${prefix}${titleJoin}${sanitizedTitle}${version}${extension}`;

      const tidalAlbumResult = await tidalAlbum;

      const albumDir = path.join(
        process.env.MUSIC_DIRECTORY || "",
        this.sanitizeFilename(tidalAlbumResult.albumArtist),
        this.sanitizeFilename(track.album.title || track.title)
      );

      /**
       * If configured, remove existing files in the target album directory.
       * Keep a timestamped cache so we only re-clean if the last clean
       * was older than `CLEAN_EXISTING_DOWNLOADS_TTL_MS` (default 1 hour).
       */
      if (this.CLEAN_EXISTING_DOWNLOADS) {
        this.removeExistingAlbum(albumDir);
      }

      fs.mkdirSync(albumDir, { recursive: true });


      const tempFile = await PegTheFile(filePath, {
        title: track.title + version,
        album: track.album.title || "",
        artist: track.artist,
        date: tidalAlbumResult.date,
        albumArtist: tidalAlbumResult.albumArtist,
        isrc: track.isrc || "",
        copyright: track.copyright || "",
        discNumber: track.volumeNr?.toString() || "",
        duration: track.duration?.toString() || "",
        popularity: track.popularity?.toString() || "",
        bpm: track.bpm?.toString() || "",
        key: track.key,
        keyScale: track.keyScale,
        explicit: track.explicit?.toString() || "",
        track: track.trackNr?.toString() || "",
      }, track.artwork);


      // Move file to correct destination
      const finalPath = path.join(albumDir, fileName);
      console.info("Copying file to : " + finalPath);
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });
      fs.copyFileSync(tempFile, finalPath);
      console.info("Removing file: " + tempFile);
      fs.rmSync(tempFile);

      console.info(`Completed track: ${track.title}`);
    } catch (e) {
      if (e instanceof AxiosError) {
        console.error(e.response)
      }
      // Clean up tmp file on error if it exists
      if (tmpFile) {
        try {
          tmpFile.removeCallback();
        } catch {
          // Ignore cleanup errors
        }
      }
      throw (e);
    }
  }

  private static removeExistingAlbum(albumDir: string) {
    const now = Date.now();
    const last = this.cleanedAlbumDirs.get(albumDir);
    const needsCleaning = !last || (now - last) > this.CLEAN_EXISTING_DOWNLOADS_TTL_MS;

    if (needsCleaning) {
      try {
        if (fs.existsSync(albumDir)) {
          const existing = fs.readdirSync(albumDir);
          if (existing.length > 0) {
            console.info(`Cleaning existing album directory: ${albumDir}`);
            fs.rmSync(albumDir, { recursive: true, force: true });
          }
        }
      } catch (err) {
        console.error(`Failed to clean album directory ${albumDir}:`, err);
      }
      this.cleanedAlbumDirs.set(albumDir, now);
    }
  }

  private static sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
  }
}


export default Downloader;
