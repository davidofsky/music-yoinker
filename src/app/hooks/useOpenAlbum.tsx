import { useContext } from "react"
import axios from "axios"
import { OpenAlbumCtx, LoadingCtx } from "@/app/context"
import { IAlbum } from "../interfaces/album.interface"

export const useOpenAlbum = () => {
  const [, setOpenAlbum] = useContext(OpenAlbumCtx)!
  const [, setLoading] = useContext(LoadingCtx)!

  const openAlbum = async (album: IAlbum) => {
    setLoading(true)
    try {
      const result = await axios.get("/api/album", {
        params: { id: album.id }
      })
      setOpenAlbum({
        Title: album.title,
        Artist: album.artists[0].name,
        Type: "Album",
        Tracks: result.data,
        ReleaseDate: album.releaseDate
      })
    } catch (error) {
      console.error("Failed to open album:", error)
    } finally {
      setLoading(false)
    }
  }

  return { openAlbum }
}
