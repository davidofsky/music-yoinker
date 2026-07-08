import QobuzDl from '@/lib/qobuzDl';
import { IProvider } from './provider.interface';

export class QobuzProvider implements IProvider {
  readonly source = 'qobuz' as const;
  searchAlbum(query: string) { return QobuzDl.searchAlbum(query); }
  searchArtist(query: string) { return QobuzDl.searchArtist(query); }
  searchTrack(query: string) { return QobuzDl.searchTrack(query); }
  searchAlbumTracks(id: string) { return QobuzDl.searchAlbumTracks(id); }
  searchArtistAlbums(id: string) { return QobuzDl.searchArtistAlbums(id); }
  downloadTrack(id: string) { return QobuzDl.downloadTrack(id); }
}
