import "./ArtistViewer.css"
import { FaXmark } from "react-icons/fa6"

import { LoadingCtx, OpenAlbumCtx, OpenArtistCtx } from "@/app/context"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { Album } from "@/lib/interfaces"
import TinyAlbum from "../TinyAlbum/TinyAlbum"
import Modal from "../Modal/Modal"


const ArtistViewer = () => {
  const [loading, setLoading] = useContext(LoadingCtx)!;
  const [openArtist, setOpenArtist] = useContext(OpenArtistCtx)!
  const [openAlbum] = useContext(OpenAlbumCtx)!
  const [albums, setAlbums] = useState<Array<Album>>([])
  const closeAction = () => setOpenArtist(null);

  useEffect(() => {
    if (openArtist === null) return;
    getArtist();
  }, [openArtist])

  const getArtist = async () => {
    setLoading(true)
    const result = await axios.get("/api/artist", {
      params: { id: openArtist?.id }
    })
    setLoading(false)
    setAlbums(result.data);
  }

  return (
    <Modal isOpen={!!openArtist && !openAlbum && !loading} onClose={closeAction}>
      <h1 className="ModalTitle">{openArtist?.name}</h1>

      <h1>Albums</h1>
      <div className="AlbumList">
        {albums.map(album => {
          return (
            <TinyAlbum key={album.id} album={album}/>
          )
        })}
      </div>

      <div className="ModalFooter">
        <button
          className="HoverButtonRed"
          onClick={closeAction}>
          <FaXmark/>
          Close page
        </button>
      </div>
    </Modal>
  )
}

export default ArtistViewer
