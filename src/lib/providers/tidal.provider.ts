import Hifi from '@/lib/hifi';
import { IProvider } from './provider.interface';

export class TidalProvider implements IProvider {
  readonly source = 'tidal' as const;
  searchAlbum(query: string) { return Hifi.searchAlbum(query); }
  searchArtist(query: string) { return Hifi.searchArtist(query); }
  searchTrack(query: string) { return Hifi.searchTrack(query); }
  searchAlbumTracks(id: string) { return Hifi.searchAlbumTracks(id); }
  searchArtistAlbums(id: string) { return Hifi.searchArtistAlbums(id); }
  downloadTrack(id: string) { return Hifi.downloadTrack(id); }
}
