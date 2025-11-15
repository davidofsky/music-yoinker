export interface Album {
  id: string
  title: string
  releaseDate: string
  artwork: Artwork
  artists: Artist[]
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
  album: string
  artist: string
  date: string
  copyright: string
  artwork: string
}

export interface Artist {
  id: string
  name: string
  albums: Album[]
}

export interface Artwork {
  id: string
  file: string
  thumbnail: string
}

export interface DisplayItem {
  Type: "Album"|"Single"
  Title: string
  Artist: string
  Tracks: Track[]
}
