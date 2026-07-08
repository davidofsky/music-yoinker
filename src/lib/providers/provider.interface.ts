import { IAlbum } from '@/app/interfaces/album.interface';
import { ITrack } from '@/app/interfaces/track.interface';
import { IArtist } from '@/app/interfaces/artist.interface';
import { DownloadTrackSource } from '@/lib/hifi';

export interface IProvider {
  readonly source: 'tidal' | 'qobuz';
  searchAlbum(query: string): Promise<IAlbum[]>;
  searchArtist(query: string): Promise<IArtist[]>;
  searchTrack(query: string): Promise<ITrack[]>;
  searchAlbumTracks(id: string): Promise<ITrack[]>;
  searchArtistAlbums(id: string): Promise<IAlbum[]>;
  downloadTrack(id: string): Promise<DownloadTrackSource>;
}
