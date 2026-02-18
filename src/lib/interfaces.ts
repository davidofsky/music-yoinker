import { ITrack } from "@/app/interfaces/track.interface"

export interface DisplayItem {
  Type: "Album" | "Single"
  Title: string
  Artist: string
  Tracks: ITrack[]
  ReleaseDate?: string
}

// Start MusicBrainz interfaces
export interface MbReleaseGroup {
  id: string;
  title: string;
  tags?: MbTag[];
}

export interface MbTag {
  name: string;
  count?: number;
}
// End MusicBrainz interfaces