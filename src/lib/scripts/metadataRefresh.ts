import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import logger from '../logger';
import musicRepository from '../music.repository';
import Tidal from '../tidal';
import { PegTheFile } from '../pegger';
import Version from '../version';
import { IAlbum } from '../../app/interfaces/album.interface';
import { ITrack } from '../../app/interfaces/track.interface';
import { addMetadata } from './media-commands';

const AUDIO_EXTENSIONS = new Set(['.flac', '.mp3', '.mp4', '.m4a', '.mov']);

export interface RefreshedFileStats {
  scanned: number;
  refreshed: number;
  skipped: number;
  failed: number;
}

interface FileMetadata {
  title?: string;
  album?: string;
  artist?: string;
  albumartist?: string;
  track?: string;
  discnumber?: string;
  source?: string;
  isrc?: string;
  version?: string;
  date?: string;
  genre?: string;
  appversion?: string;
  [key: string]: string | undefined;
}

interface ResolvedTrackMetadata {
  track: ITrack;
  albumArtist: string;
  releaseDate: string;
  genres: string[];
  artwork: string;
}

interface ResolvedAlbumMetadata {
  album: IAlbum;
  albumArtist: string;
  releaseDate: string;
  genres: string[];
  artwork: string;
  tracks: ITrack[];
}

class MetadataRefreshService {
  private async extractMetadata(filePath: string): Promise<FileMetadata> {
    return addMetadata(filePath);
  }

  private async scanAudioFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files.push(...await this.scanAudioFiles(fullPath));
        continue;
      }

      if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private normalize(value?: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private parseNumberTag(value?: string): number | null {
    if (!value) return null;
    const match = String(value).match(/\d+/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private buildSearchQueries(metadata: FileMetadata): string[] {
    const artist = metadata.artist || metadata.albumartist || '';
    const album = metadata.album || '';
    const title = metadata.title || '';

    const queries = [
      [artist, album, title].filter(Boolean).join(' '),
      [artist, album].filter(Boolean).join(' '),
      [artist, title].filter(Boolean).join(' '),
      [album, title].filter(Boolean).join(' '),
      title,
    ];

    return queries
      .map(query => query.trim())
      .filter((query, index, array) => query.length > 0 && array.indexOf(query) === index);
  }

  private buildAlbumSearchQueries(metadata: FileMetadata): string[] {
    const artist = metadata.artist || metadata.albumartist || '';
    const album = metadata.album || '';

    const queries = [
      album,
      [artist, album].filter(Boolean).join(' '),
      [album, artist].filter(Boolean).join(' '),
      artist,
    ];

    return queries
      .map(query => query.trim())
      .filter((query, index, array) => query.length > 0 && array.indexOf(query) === index);
  }

  private scoreTrackCandidate(track: ITrack, metadata: FileMetadata, preferredSource?: string): number {
    let score = 0;
    const source = preferredSource?.toLowerCase();

    if (source && track.source && track.source !== source) {
      score -= 15;
    }

    const trackTitle = this.normalize(track.title);
    const fileTitle = this.normalize(metadata.title);
    const trackArtist = this.normalize(track.artist?.name);
    const fileArtist = this.normalize(metadata.artist || metadata.albumartist);
    const trackAlbum = this.normalize(track.album?.title);
    const fileAlbum = this.normalize(metadata.album);

    if (fileTitle && trackTitle === fileTitle) score += 60;
    else if (fileTitle && trackTitle.includes(fileTitle)) score += 35;
    else if (fileTitle && fileTitle.includes(trackTitle)) score += 25;

    if (fileArtist && trackArtist === fileArtist) score += 30;
    else if (fileArtist && trackArtist.includes(fileArtist)) score += 15;

    if (fileAlbum && trackAlbum === fileAlbum) score += 20;
    else if (fileAlbum && trackAlbum.includes(fileAlbum)) score += 10;

    const fileTrack = this.parseNumberTag(metadata.track);
    const fileDisc = this.parseNumberTag(metadata.discnumber);

    if (fileTrack !== null && fileTrack === track.trackNumber) score += 20;
    if (fileDisc !== null && fileDisc === track.volumeNumber) score += 8;

    if (metadata.isrc && track.isrc && metadata.isrc.toLowerCase() === track.isrc.toLowerCase()) score += 45;

    return score;
  }

  private scoreAlbumCandidate(album: ITrack['album'] & { source?: string }, metadata: FileMetadata): number {
    let score = 0;
    const albumTitle = this.normalize(album.title);
    const fileAlbum = this.normalize(metadata.album);
    const fileArtist = this.normalize(metadata.artist || metadata.albumartist);
    const albumArtist = this.normalize((album as IAlbum).artists?.[0]?.name);

    if (fileAlbum && albumTitle === fileAlbum) score += 50;
    else if (fileAlbum && albumTitle.includes(fileAlbum)) score += 25;
    else if (fileAlbum && fileAlbum.includes(albumTitle)) score += 15;

    if (fileArtist && albumArtist === fileArtist) score += 30;
    else if (fileArtist && albumArtist.includes(fileArtist)) score += 15;

    return score;
  }

  private async resolveTrackBySearch(metadata: FileMetadata): Promise<ITrack | null> {
    const queries = this.buildSearchQueries(metadata);
    const preferredSource = metadata.source?.toLowerCase();
    const allResults: ITrack[] = [];

    for (const query of queries) {
      const results = await musicRepository.searchTrack(query);
      allResults.push(...results);
      if (results.length > 0) break;
    }

    if (allResults.length === 0) return null;

    const ranked = allResults
      .map(track => ({ track, score: this.scoreTrackCandidate(track, metadata, preferredSource) }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best || best.score < 25) return null;
    return best.track;
  }

  private selectTrackFromAlbum(metadata: FileMetadata, albumTracks: ITrack[]): { track: ITrack; score: number } | null {
    const targetTrack = this.parseNumberTag(metadata.track);
    const targetDisc = this.parseNumberTag(metadata.discnumber);
    const normalizedTitle = this.normalize(metadata.title);
    const preferredSource = metadata.source?.toLowerCase();

    const rankedTracks = albumTracks
      .map(track => {
        let score = 0;

        if (preferredSource && track.source && track.source !== preferredSource) {
          score -= 10;
        }

        if (targetTrack !== null && track.trackNumber === targetTrack) score += 50;
        if (targetDisc !== null && track.volumeNumber === targetDisc) score += 15;

        const trackTitle = this.normalize(track.title);
        if (normalizedTitle && trackTitle === normalizedTitle) score += 35;
        else if (normalizedTitle && trackTitle.includes(normalizedTitle)) score += 20;
        else if (normalizedTitle && normalizedTitle.includes(trackTitle)) score += 10;

        return { track, score };
      })
      .sort((a, b) => b.score - a.score);

    const bestTrack = rankedTracks[0];
    if (!bestTrack || bestTrack.score < 20) return null;

    return bestTrack;
  }

  private async resolveAlbumMetadata(metadata: FileMetadata): Promise<ResolvedAlbumMetadata | null> {
    const queries = this.buildAlbumSearchQueries(metadata);
    const preferredSource = metadata.source?.toLowerCase();
    let bestAlbum: IAlbum & { source?: string } | null = null;
    let bestScore = -1;

    for (const query of queries) {
      let results: Array<IAlbum & { source?: string }> = [];

      try {
        results = await musicRepository.searchAlbum(query);
      } catch (error) {
        logger.warn(`[MetadataRefresh] Album search failed for query "${query}":`, error);
        continue;
      }

      if (results.length === 0) {
        continue;
      }

      const rankedAlbums = results
        .map(album => ({ album, score: this.scoreAlbumCandidate(album, metadata) }))
        .sort((a, b) => b.score - a.score);

      const candidate = rankedAlbums[0];
      if (candidate && candidate.score > bestScore) {
        bestAlbum = candidate.album;
        bestScore = candidate.score;
      }

      if (bestScore >= 40) {
        break;
      }
    }

    if (!bestAlbum) return null;

    const tracks = await musicRepository.searchAlbumTracks(String(bestAlbum.id), bestAlbum.source ?? preferredSource ?? undefined);
    if (tracks.length === 0) return null;

    if (bestAlbum.source === 'tidal') {
      const album = await Tidal.getAlbum(String(bestAlbum.id));
      return {
        album: bestAlbum,
        albumArtist: album.albumArtist || bestAlbum.artists?.[0]?.name || metadata.artist || metadata.albumartist || '',
        releaseDate: album.releaseDate || bestAlbum.releaseDate || metadata.date || '',
        genres: album.genres || [],
        artwork: bestAlbum.artwork || tracks[0]?.artwork || '',
        tracks,
      };
    }

    return {
      album: bestAlbum,
      albumArtist: bestAlbum.artists?.[0]?.name || metadata.artist || metadata.albumartist || '',
      releaseDate: bestAlbum.releaseDate || metadata.date || '',
      genres: [],
      artwork: bestAlbum.artwork || tracks[0]?.artwork || '',
      tracks,
    };
  }

  private buildMetadata(trackInfo: ResolvedTrackMetadata): Record<string, string> {
    const { track, albumArtist, releaseDate, genres, artwork } = trackInfo;
    const version = track.version && track.version.toString().trim() !== '' ? ` (${track.version.toString().trim()})` : '';

    return {
      title: `${track.title}${version}`,
      album: track.album?.title || '',
      artist: track.artist?.name || albumArtist || '',
      date: releaseDate,
      albumArtist,
      genre: genres.join(', '),
      isrc: track.isrc || '',
      copyright: track.copyright || '',
      discNumber: track.volumeNumber?.toString() || '',
      duration: track.duration?.toString() || '',
      popularity: track.popularity?.toString() || '',
      bpm: track.bpm?.toString() || '',
      key: track.key || '',
      keyScale: track.keyScale || '',
      explicit: track.explicit?.toString() || '',
      track: track.trackNumber?.toString() || '',
      appVersion: Version.APP_VERSION,
      source: track.source === 'qobuz' ? 'Qobuz' : 'Tidal',
      artwork,
    };
  }

  private buildMetadataFromAlbum(track: ITrack, album: ResolvedAlbumMetadata): ResolvedTrackMetadata {
    return {
      track,
      albumArtist: album.albumArtist || track.artist?.name || '',
      releaseDate: album.releaseDate || track.releaseDate || '',
      genres: album.genres,
      artwork: album.artwork || track.artwork || '',
    };
  }

  private buildMetadataFromSearch(track: ITrack): ResolvedTrackMetadata {
    if (track.source === 'tidal' && track.album?.id) {
      throw new Error('Tidal track metadata should be built from album context');
    }

    return {
      track,
      albumArtist: track.artist?.name || '',
      releaseDate: track.releaseDate || '',
      genres: [],
      artwork: track.artwork || '',
    };
  }

  private async rewriteFile(filePath: string, metadata: Record<string, string>, coverUrl: string): Promise<void> {
    const ext = path.extname(filePath) || '.flac';
    const stagingInput = tmp.fileSync({ postfix: ext });
    fs.copyFileSync(filePath, stagingInput.name);

    const stagedOutput = await PegTheFile(stagingInput.name, metadata, coverUrl);
    fs.copyFileSync(stagedOutput, filePath);
    fs.rmSync(stagedOutput);
  }

  public async refreshFile(filePath: string, dryRun = false): Promise<boolean> {
    const metadata = await this.extractMetadata(filePath);
    const resolvedAlbum = await this.resolveAlbumMetadata(metadata);
    let resolved: ResolvedTrackMetadata | null = null;

    if (resolvedAlbum) {
      const selected = this.selectTrackFromAlbum(metadata, resolvedAlbum.tracks);
      if (selected) {
        resolved = this.buildMetadataFromAlbum(selected.track, resolvedAlbum);
      }
    }

    if (!resolved) {
      const track = await this.resolveTrackBySearch(metadata);
      if (track) {
        resolved = this.buildMetadataFromSearch(track);
      }
    }

    if (!resolved) {
      logger.warn(`[MetadataRefresh] Could not resolve metadata for ${path.basename(filePath)}`);
      return false;
    }

    const nextMetadata = this.buildMetadata(resolved);

    if (dryRun) {
      logger.info(`[MetadataRefresh] Dry run: would refresh ${path.basename(filePath)} -> ${resolved.track.artist?.name} / ${resolved.track.album?.title} / ${resolved.track.title}`);
      return true;
    }

    await this.rewriteFile(filePath, nextMetadata, resolved.artwork);
    logger.info(`[MetadataRefresh] Refreshed ${path.basename(filePath)}`);
    return true;
  }

  public async refreshDirectory(dirPath: string, dryRun = false): Promise<RefreshedFileStats> {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const files = await this.scanAudioFiles(dirPath);
    const filesByDirectory = new Map<string, string[]>();

    for (const filePath of files) {
      const albumDir = path.dirname(filePath);
      const group = filesByDirectory.get(albumDir) || [];
      group.push(filePath);
      filesByDirectory.set(albumDir, group);
    }

    const stats: RefreshedFileStats = {
      scanned: files.length,
      refreshed: 0,
      skipped: 0,
      failed: 0,
    };

    for (const fileGroup of filesByDirectory.values()) {
      const metadataList = await Promise.all(fileGroup.map(async filePath => ({
        filePath,
        metadata: await this.extractMetadata(filePath),
      })));

      const representative = metadataList
        .map(item => item.metadata)
        .sort((a, b) => {
          const aScore = Number(Boolean(a.album)) + Number(Boolean(a.artist || a.albumartist)) + Number(Boolean(a.title)) + Number(Boolean(a.track));
          const bScore = Number(Boolean(b.album)) + Number(Boolean(b.artist || b.albumartist)) + Number(Boolean(b.title)) + Number(Boolean(b.track));
          return bScore - aScore;
        })[0] || metadataList[0]?.metadata;

      const albumContext = representative ? await this.resolveAlbumMetadata(representative) : null;

      for (const { filePath, metadata } of metadataList) {
        try {
          let resolved: ResolvedTrackMetadata | null = null;

          if (albumContext) {
            const selected = this.selectTrackFromAlbum(metadata, albumContext.tracks);
            if (selected) {
              resolved = this.buildMetadataFromAlbum(selected.track, albumContext);
            }
          }

          if (!resolved) {
            const track = await this.resolveTrackBySearch(metadata);
            if (track) {
              resolved = this.buildMetadataFromSearch(track);
            }
          }

          if (!resolved) {
            stats.skipped += 1;
            logger.warn(`[MetadataRefresh] Could not resolve metadata for ${path.basename(filePath)}`);
            continue;
          }

          const nextMetadata = this.buildMetadata(resolved);

          if (dryRun) {
            logger.info(`[MetadataRefresh] Dry run: would refresh ${path.basename(filePath)} -> ${resolved.track.artist?.name} / ${resolved.track.album?.title} / ${resolved.track.title}`);
            stats.refreshed += 1;
            continue;
          }

          await this.rewriteFile(filePath, nextMetadata, resolved.artwork);
          stats.refreshed += 1;
          logger.info(`[MetadataRefresh] Refreshed ${path.basename(filePath)}`);
        } catch (error) {
          stats.failed += 1;
          logger.error(`[MetadataRefresh] Failed to refresh ${filePath}:`, error);
        }
      }
    }

    return stats;
  }
}

declare global {
  var metadataRefreshService: MetadataRefreshService;
}

if (!global.metadataRefreshService) {
  global.metadataRefreshService = new MetadataRefreshService();
}

export default global.metadataRefreshService;
export { MetadataRefreshService };