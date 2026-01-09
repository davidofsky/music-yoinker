import { ITidalTrack } from "@/app/interfaces/tidal-track.interface"

export interface Album {
  id: string
  title: string
  releaseDate: string
  artwork: string
  artists: Artist[]
  color: string
  isDownloaded?: boolean
}

export interface Artist {
  id: string
  name: string
  picture: string
}

export interface DisplayItem {
  Type: "Album"|"Single"
  Title: string
  Artist: string
  Tracks: ITidalTrack[]
  ReleaseDate?: string
}
