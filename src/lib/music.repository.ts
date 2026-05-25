import Config from './config';
import { IProvider } from './providers/provider.interface';
import { TidalProvider } from './providers/tidal.provider';
import { QobuzProvider } from './providers/qobuz.provider';
import { IAlbum } from '@/app/interfaces/album.interface';
import { ITrack } from '@/app/interfaces/track.interface';
import { IArtist } from '@/app/interfaces/artist.interface';

class MusicRepository {
  private readonly providers: IProvider[];

  constructor() {
    this.providers = [];
    if (Config.HIFI_SOURCES.length > 0) this.providers.push(new TidalProvider());
    if (Config.QOBUZ_DL_SOURCES.length > 0) this.providers.push(new QobuzProvider());
  }

  private async runAll<T>(fn: (p: IProvider) => Promise<T[]>): Promise<T[]> {
    const results = await Promise.allSettled(this.providers.map(fn));
    results.filter(r => r.status === 'rejected').forEach(r => {
      logger.warn('[MusicRepository] Provider failed:', (r as PromiseRejectedResult).reason);
    });
    return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  }

  private getProvider(source?: string | null): IProvider {
    const provider = this.providers.find(p => p.source === source) ?? this.providers[0];
    if (!provider) throw new Error('No music providers configured');
    return provider;
  }

  searchAlbum(query: string): Promise<IAlbum[]> { return this.runAll(p => p.searchAlbum(query)); }
  searchArtist(query: string): Promise<IArtist[]> { return this.runAll(p => p.searchArtist(query)); }
  searchTrack(query: string): Promise<ITrack[]> { return this.runAll(p => p.searchTrack(query)); }
  searchAlbumTracks(id: string, source?: string | null): Promise<ITrack[]> { return this.getProvider(source).searchAlbumTracks(id); }
  searchArtistAlbums(id: string, source?: string | null): Promise<IAlbum[]> { return this.getProvider(source).searchArtistAlbums(id); }
  downloadTrack(id: string, source?: string | null) { return this.getProvider(source).downloadTrack(id); }
}

declare global {
  var musicRepository: MusicRepository;
}

if (!global.musicRepository) {
  global.musicRepository = new MusicRepository();
}

export default global.musicRepository;
