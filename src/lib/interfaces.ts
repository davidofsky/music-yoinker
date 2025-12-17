export interface Album {
  id: string
  title: string
  releaseDate: string
  artwork: string
  artists: Artist[]
  color: string
}

export interface Track {
  id: string
  title: string
  volumeNr: number
  trackNr: number
  duration: number
  popularity: number
  bpm: number
  key: string
  isrc: string
  keyScale: string
  explicit: boolean
  type: "album"|"single"
  version: string
  album: Album
  artist: string
  copyright: string
  artwork: string
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
  Tracks: Track[]
  ReleaseDate?: string
}
