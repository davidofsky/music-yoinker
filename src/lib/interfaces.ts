export interface Album {
  id: string
  title: string
  releaseDate: string
  artwork: Artwork
  artists: Artist[]
  tracks: Track[]
}

export interface Track {
  id: string
  title: string
  volumeNr: number
  trackNr: number
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
