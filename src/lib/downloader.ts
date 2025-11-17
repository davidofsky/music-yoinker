import fs from 'fs';
import tmp from 'tmp';
import axios, { AxiosError } from "axios";
import path from 'path';
import { Track } from "./interfaces";
import { broadcast } from './websocket';
import { PegTheFile } from './pegger';
import Hifi from './hifi'

class Downloader {
  private static queue: Track[] = []
  private static processing: boolean = false;
  public static GetQueue = () => {return this.queue}

  public static AddToQueue(tracks: Track[]) {
    this.queue.push(...tracks);

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
        broadcast({ type: 'queue', message: JSON.stringify(this.queue) });
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

      tmpFile = tmp.fileSync({ postfix: '.flac' });
      const filePath = tmpFile.name;

      console.debug('retrieving album data')
      const album = Hifi.downloadAlbum(track.album_id).then((e) => {
        console.debug('retrieved album');
        return e;
      });

      console.debug('retrieving blob')
      const response = await axios.get(blobUrl, {
        responseType: 'arraybuffer',
        timeout: 60000 // Longer timeout for actual download
      }).then((e) => {console.debug('retrieved blob'); return e;});

      fs.writeFileSync(filePath, response.data);

      let version = '';
      if (track.version !== '') version = ` (${track.version})`

      const sanitizedTitle = this.sanitizeFilename(track.title);
      const fileName = `${track.volumeNr}.${track.trackNr} ${sanitizedTitle} ${version}.flac`.trim();

      const albumDir = path.join(
        process.env.MUSIC_DIRECTORY || "",
        this.sanitizeFilename(track.artist),
        this.sanitizeFilename(track.album||track.title)
      );

      fs.mkdirSync(albumDir, { recursive: true });

      const tempFile = await PegTheFile(filePath, {
        title: track.title + version,
        artist: track.artist,
        date: (await album).releaseDate,
        album: track.album || "",
        isrc: track.isrc,
        copyright: track.copyright,
        discNumber: track.volumeNr.toString(),
        duration: track.duration.toString(),
        popularity: track.popularity.toString(),
        bpm: track.bpm.toString(),
        key: track.key,
        keyScale: track.keyScale,
        explicit: track.explicit.toString(),
        track: track.trackNr.toString(),
      }, track.artwork);


      // Move file to correct destination
      const finalPath = path.join(albumDir, fileName);
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
