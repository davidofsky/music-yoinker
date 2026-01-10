import { ITrack } from "@/app/interfaces/track.interface"

export interface Artist {
  id: string
  name: string
  picture: string
}

export interface DisplayItem {
  Type: "Album"|"Single"
  Title: string
  Artist: string
  Tracks: ITrack[]
  ReleaseDate?: string
}
