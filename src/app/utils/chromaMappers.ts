import { CSSProperties } from "react";
import { ChromaItem } from "@/app/reactbits/ChromaGrid";
import { IAlbum } from "@/app/interfaces/album.interface";

export const CHROMA_GRID_CONFIG = {
  damping: 0.45,
  fadeOut: 0.6,
  ease: "power3.out" as const,
  columns: 4
}

export const GRID_CONTENT_STYLE: CSSProperties = { padding: '32px 24px', display: 'flex', justifyContent: 'center' }

export const albumToChromaItem = (album: IAlbum, onOpen: (album: IAlbum) => void): ChromaItem => {
  return {
    image: album.artwork,
    artist: album.artists[0].name,
    year: album.releaseDate.split("-")[0],
    title: `${album.title}`,
    borderColor: "#aaa",
    gradient: `linear-gradient(145deg, ${album.vibrantColor || "#1f1f1f"}, #000000)`,
    isDownloaded: album.isDownloaded,
    onClick: () => onOpen(album)
  }
}
