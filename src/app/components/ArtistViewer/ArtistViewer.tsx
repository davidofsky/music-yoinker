import { AnimatePresence, motion } from "motion/react"
import "./ArtistViewer.css"
import { FaXmark } from "react-icons/fa6"

import { LoadingCtx, OpenAlbumCtx, OpenArtistCtx } from "@/app/context"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { Album } from "@/lib/interfaces"
import TinyAlbum from "../TinyAlbum/TinyAlbum"


const ArtistViewer = () => {
  const [loading, setLoading] = useContext(LoadingCtx)!;
  const [openArtist, setOpenArtist] = useContext(OpenArtistCtx)!
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!
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
    <AnimatePresence>
    {openArtist && !openAlbum && !loading &&
      <div className="ModalBackground" onClick={closeAction}>
        <motion.div
          className="Modal"
          initial={{ opacity: 0, scale:.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: {
              default: {type: "tween"},
              opacity: {ease: "linear"}
            }
          }}
          exit=   {{ opacity: 0, scale:.8}}
          onClick={(e) => e.stopPropagation()}
        >
        <h1 className="ModalTitle">{openArtist.name}</h1>


        <h1>Albums</h1>
        <div className="AlbumList">
        {albums.map(album => {
          return (
            <TinyAlbum album={album}/>
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
        </motion.div>
      </div>
    }
    </AnimatePresence>
  )
}

export default ArtistViewer
