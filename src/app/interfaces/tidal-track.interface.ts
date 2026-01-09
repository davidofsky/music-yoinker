export interface ITidalTrack {
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
    artist: ITidalTrackArtist;
    artists: ITidalTrackArtist[];
    album: ITidalTrackAlbum;
    mixes: { TRACK_MIX: string };

    // Custom properties
    artwork: string;
    isDownloaded: boolean;
}

export interface ITidalTrackArtist {
    id: number;
    name: string;
    handle: string | null;
    type: string;
    picture: string;
}

export interface ITidalTrackAlbum {
    id: number;
    title: string;
    cover: string;
    vibrantColor: string;
    videoCover: string | null;
}