import fs from 'fs';
import tmp from 'tmp';
import axios, { AxiosError } from "axios";
import path from 'path';
import { Album, Track } from "./interfaces";
import { broadcast } from './websocket';
import { PegTheFile } from './pegger';

class Downloader {
  private static hifiSource = 'https://tidal.401658.xyz'
  private static quality = 'LOSSLESS';
  private static queue: Album[] = []
  private static processing: boolean = false;
  private static maxRetries = 5;
  private static retryDelay = 2000; // 2 seconds between retries

  public static GetQueue = () => {return this.queue}

  public static AddToQueue(a: Album) {
    if (this.queue.some(album => album === a)) return;
    this.queue.push(a);

    broadcast({
      type: 'queue',
      message: JSON.stringify(this.queue)
    });

    this.download().catch(err => {
      console.error("Queue processing error:", err);
    });
  }

  private static async download() {
    if (this.processing) return;
    if (!this.queue || this.queue.length === 0) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const album = this.queue[0];
        if (!album) {
          this.queue.shift(); // unexpected null, remove it
          continue;
        }

        console.info(`Downloading album: ${album.title}`);

        try {
          if (album.tracks?.length > 0) {
            for (const track of album.tracks) {
              await this.downloadTrackWithRetry(album, track);
            }
          }

          console.info(`Completed album: ${album.title}`);
        } catch (err) {
          console.error(`Error downloading album ${album.title}:`, err);
          // Optionally: decide if you want to skip album or still shift it
        }

        // Shift the queue **after all tracks are awaited**
        this.queue.shift();
        broadcast({ type: 'queue', message: JSON.stringify(this.queue) });
      }
    } finally {
      this.processing = false;
    }
  }
   

  private static async downloadTrackWithRetry(album: Album, track: Track) {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.downloadTrack(album, track);
        return; 
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt}/${this.maxRetries} failed for track ${track.title}:`, error);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt; // exponential delay
          console.info(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    console.error(`Failed to download track ${track.title} after ${this.maxRetries} attempts`);
    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async downloadTrack(album: Album, track: Track) {
    let tmpFile: tmp.FileResult | null = null;
    
    try {
      console.info(`Downloading track: ${track.title}`);
      
      const result = await axios.get(`${this.hifiSource}/track`, {
        params: {
          id: track.id,
          quality: this.quality
        },
        timeout: 30000
      });
      
      const info = result.data[0];
      const blobUrl = result.data[2].OriginalTrackUrl;
      
      tmpFile = tmp.fileSync({ postfix: '.flac' });
      const filePath = tmpFile.name;
      
      const response = await axios.get(blobUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000 // Longer timeout for actual download
      });
      
      fs.writeFileSync(filePath, response.data);
      
      const version = info.version || "";
      const sanitizedTitle = this.sanitizeFilename(info.title);
      const fileName = `${info.volumeNumber}.${info.trackNumber} ${sanitizedTitle} ${version}.flac`.trim();
      
      const albumDir = path.join(
        process.env.MUSIC_DIRECTORY || "", 
        this.sanitizeFilename(album.artists[0].name), 
        this.sanitizeFilename(album.title)
      );
      
      fs.mkdirSync(albumDir, { recursive: true });
      
      const tempFile = await PegTheFile(filePath, {
        title: info.title,
        artist: info.artist.name,
        date: album.releaseDate,
        album: album.title,
        album_artist: album.artists[0].name,
        isrc: info.isrc,
        version: version,
        copyright: info.copyright,
        track: info.trackNumber,
        discNumber: info.volumeNumber,
      }, album.artwork.file);

      // Move file to correct destination
      const finalPath = path.join(albumDir, fileName);
      fs.mkdirSync(path.dirname(finalPath), { recursive: true });
      fs.copyFileSync(tempFile, finalPath);
      
      console.info(`Completed track: ${track.title}`);
      
    } catch (e) {
      console.error(`Error downloading track ${track.title}:`, e);
      if (e instanceof AxiosError) {
        console.error(e.response)
      }
      // Clean up tmp file on error if it exists
      if (tmpFile) {
        try {
          tmpFile.removeCallback();
        } catch (_) {
          // Ignore cleanup errors
        }
      }
      throw (e);
    }
  }

  private static sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
  }
}


export default Downloader;
