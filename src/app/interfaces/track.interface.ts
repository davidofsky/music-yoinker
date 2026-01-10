import { ISimpleAlbum } from './album.interface';
import { ISimpleArtist } from './artist.interface';

export interface ITrack {
  id: number;
  title: string;
  duration: number;
  replayGain: number;
  peak: number;
  allowStreaming: boolean;
  streamReady: boolean;
  payToStream: boolean;
  adSupportedStreamReady: boolean;
  djReady: boolean;
  stemReady: boolean;
  streamStartDate: string;
  premiumStreamingOnly: boolean;
  trackNumber: number;
  volumeNumber: number;
  version: string | null;
  popularity: number;
  copyright: string;
  bpm: number;
  key: string;
  keyScale: string | null;
  url: string;
  isrc: string;
  editable: boolean;
  explicit: boolean;
  audioQuality: string;
  audioModes: string[];
  mediaMetadata: {
    tags: string[];
  };
  upload: boolean;
  accessType: string | null;
  spotlighted: boolean;
  artist: ISimpleArtist;
  artists: ISimpleArtist[];
  album: ISimpleAlbum;
  mixes: { TRACK_MIX: string };

  /** Custom properties */
  artwork: string;
  isDownloaded: boolean;
}