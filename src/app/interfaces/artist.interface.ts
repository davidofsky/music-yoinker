export interface IArtist extends ISimpleArtist {
  artistTypes: string[];
  url: string;
  selectedAlbumCoverFallback: string | null;
  popularity: number;
  artistRoles: {
    categoryId: number;
    category: string;
  }[];
  mixes: {
    ARTIST_MIX: string;
  };
  userId: string | null;
  spotlighted: boolean;
}

export interface ISimpleArtist {
  id: number;
  name: string;
  handle: string | null;
  type: string;
  picture: string;
}