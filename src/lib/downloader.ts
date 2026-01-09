import fs from 'fs';
import tmp from 'tmp';
import axios, { AxiosError } from "axios";
import path from 'path';
import { Album } from "./interfaces";
import Tidal from "./tidal"
import { broadcastQueue } from '@/lib/broadcast';
import { PegTheFile } from './pegger';
import Hifi, { DownloadTrackSource } from './hifi'
import Config from './config';
import { ITrack } from '@/app/interfaces/track.interface';

class Downloader {
  private queue: ITrack[] = [];
  private processing: boolean = false;
  private cleanedAlbumDirs: Map<string, number> = new Map();
  public GetQueue = () => { return this.queue };

  private async isArtistAlbumDownloaded(artistName: string, albumTitle: string): Promise<boolean> {
    if (!artistName || !albumTitle) return false;
    try {
      const sanitizedArtist = this.sanitizeFilename(artistName);
      const sanitizedAlbum = this.sanitizeFilename(albumTitle);
      const albumDir = path.join(Config.MUSIC_DIRECTORY, sanitizedArtist, sanitizedAlbum);

      if (!fs.existsSync(albumDir)) {
        return false;
      }

      const files = fs.readdirSync(albumDir);
      return files.some(file => file.endsWith('.flac') || file.endsWith('.mp4') || file.endsWith('.mp3'));
    } catch (err) {
      console.error('[isArtistAlbumDownloaded] Error checking if album is downloaded:', err);
      return false;
    }
  }

  public async IsAlbumDownloaded(album: Album): Promise<boolean> {
    return this.isArtistAlbumDownloaded(album.artists[0].name, album.title);
  }

  public async IsTrackDownloaded(track: ITrack): Promise<boolean> {
    return await this.isArtistAlbumDownloaded(track.artist.name, track.album.title);
  }

  private formatTrackNumber(value?: number | string) {
    if (!value) return '';
    const s = value.toString().trim();
    if (s === '') return '';
    return s.padStart(Config.TRACK_PAD_LENGTH, '0');
  }

  public AddToQueue(tracks: ITrack[]) {
    this.queue.push(...tracks);
    broadcastQueue(this.queue);
    this.download().catch(err => {
      console.error("Queue processing error:", err);
    });
  }

  // Returns error message if exists
  public RemoveFromQueue(trackId: string): string | null {
    console.log("removing track with id ", trackId)
    const index = this.queue.findIndex(q => q.id.toString() === trackId.toString());
    if (index === -1) return `Queue does not contain track with id: ${trackId}.`;
    if (index === 0) return `Track with id ${trackId} is currently being processed.`;
    this.queue.splice(index, 1);
    broadcastQueue(this.queue);
    return null
  }

  private async download() {
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


  private async downloadTrack(track: ITrack) {
    let tmpFile: tmp.FileResult | null = null;

    try {
      console.info(`Downloading track: ${track.title}`);
      const downloadSource: DownloadTrackSource = await Hifi.downloadTrack(track.id.toString());
      const tidalAlbum = Tidal.getAlbum(track.album.id.toString());

      const urls = downloadSource.type === 'dash' ? [downloadSource.initUrl, ...downloadSource.segmentUrls] : [downloadSource.url];
      const defaultExtension = downloadSource.type === 'dash' ? downloadSource.extension : '.flac';

      const buffers: Buffer[] = [];
      let contentType: string | undefined;

      for (const url of urls) {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        if (!contentType) contentType = response.headers['content-type'];
        buffers.push(Buffer.from(response.data));
      }

      const payload = Buffer.concat(buffers);
      const extension = this.resolveExtensionFromContentType(contentType, defaultExtension);

      tmpFile = tmp.fileSync({ postfix: extension });
      const filePath = tmpFile.name;

      fs.writeFileSync(filePath, payload);

      const version = (track.version && track.version.toString().trim() !== '') ? ` (${track.version.toString().trim()})` : '';
      const sanitizedTitle = this.sanitizeFilename(track.title);
      const volStr = this.formatTrackNumber(track.volumeNumber);
      const trackStr = this.formatTrackNumber(track.trackNumber);

      let prefix = '';
      if (volStr && trackStr) prefix = `${volStr}${Config.TRACK_DISC_SEPARATOR}${trackStr}`;
      else if (trackStr) prefix = `${trackStr}`;
      else if (volStr) prefix = `${volStr}`;

      console.debug("Using track prefix:", prefix === '' ? '(none)' : `"${prefix}"`);
      console.debug("Using track title separator:", `"${Config.TRACK_TITLE_SEPARATOR}"`);
      const titleJoin = prefix ? Config.TRACK_TITLE_SEPARATOR : '';
      const fileName = `${prefix}${titleJoin}${sanitizedTitle}${version}${extension}`;

      const tidalAlbumResult = await tidalAlbum;

      const albumDir = path.join(
        Config.MUSIC_DIRECTORY,
        this.sanitizeFilename(tidalAlbumResult.albumArtist),
        this.sanitizeFilename(track.album.title || track.title)
      );

      /**
       * If configured, remove existing files in the target album directory.
       * Keep a timestamped cache so we only re-clean if the last clean
       * was older than `CLEAN_EXISTING_DOWNLOADS_TTL_MS` (default 1 hour).
       */
      if (Config.CLEAN_EXISTING_DOWNLOADS) {
        this.removeExistingAlbum(albumDir);
      }

      fs.mkdirSync(albumDir, { recursive: true });

      const tempFile = await PegTheFile(filePath, {
        title: track.title + version,
        album: track.album.title || "",
        artist: track.artist.name,
        date: tidalAlbumResult.date,
        albumArtist: tidalAlbumResult.albumArtist,
        isrc: track.isrc || "",
        copyright: track.copyright || "",
        discNumber: track.volumeNumber?.toString() || "",
        duration: track.duration?.toString() || "",
        popularity: track.popularity?.toString() || "",
        bpm: track.bpm?.toString() || "",
        key: track.key,
        keyScale: track.keyScale || "",
        explicit: track.explicit?.toString() || "",
        track: track.trackNumber?.toString() || "",
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

  private removeExistingAlbum(albumDir: string) {
    const now = Date.now();
    const last = this.cleanedAlbumDirs.get(albumDir);
    const needsCleaning = !last || (now - last) > Config.CLEAN_EXISTING_DOWNLOADS_TTL_MS;

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

  private sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
  }

  private resolveExtensionFromContentType(contentType?: string, fallback = '.flac'): string {
    if (!contentType) return fallback;
    const lower = contentType.toLowerCase();
    if (lower.includes('audio/mp4') || lower.includes('mp4')) return '.mp4';
    if (lower.includes('audio/mp3') || lower.includes('mpeg')) return '.mp3';
    if (lower.includes('flac')) return '.flac';
    return fallback;
  }
}

declare global {
  var downloader: Downloader;
}

if (!global.downloader) {
  global.downloader = new Downloader();
}

export default global.downloader;