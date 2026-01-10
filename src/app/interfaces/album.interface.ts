import { ISimpleArtist } from "./artist.interface";

export interface IAlbum extends ISimpleAlbum {
  duration: number;
  streamReady: boolean;
  payToStream: boolean;
  adSupportedStreamReady: boolean;
  djReady: boolean;
  stemReady: boolean;
  streamStartDate: string;
  allowStreaming: boolean;
  premiumStreamingOnly: boolean;
  numberOfTracks: number;
  numberOfVideos: number;
  numberOfVolumes: number;
  releaseDate: string;
  copyright: string;
  type: string;
  version: null;
  url: string;
  explicit: boolean;
  upc: string;
  popularity: number;
  audioQuality: string;
  audioModes: string[];
  mediaMetadata: {
    tags: string[];
  };
  upload: boolean;
  artists: ISimpleArtist[];

  /** Custom properties */
  artwork: string;
  isDownloaded: boolean;
}

export interface ISimpleAlbum {
  id: number;
  title: string;
  cover: string;
  vibrantColor: string;
  videoCover: string | null;
}