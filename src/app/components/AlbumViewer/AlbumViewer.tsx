import { AnimatePresence, motion } from "motion/react"
import { FaDownload } from 'react-icons/fa'
import "./AlbumViewer.css"
import axios from "axios"
import { FaXmark } from "react-icons/fa6"
import { Track } from "@/lib/interfaces";

import { OpenAlbumCtx } from "@/app/context"
import { useContext, useState, useEffect } from "react"

const AlbumViewer = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!
  const closeAction = () => setOpenAlbum(null);

  const [tracks, setTracks] = useState<Track[]>([])
  const getAlbumTracks = async () => {
    const result = await axios.get("/api/album", {
      params: { id: openAlbum?.id }
    })
    setTracks(result.data);
  }

  useEffect(() => {
    if (openAlbum) getAlbumTracks();
    else setTracks([])
  }, [openAlbum])

  const downloadAlbum = async () => {
    axios.post("/api/albums", tracks)
  }

  return (
    <AnimatePresence>
    {openAlbum && 
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
        <h1 className="ModalTitle">{openAlbum.title}</h1>
        <h1 className="ModalSubTitle">{openAlbum.artists[0].name}</h1>
          <h1>Tracks</h1>

          {(tracks.length < 1) && <h2>loading...</h2>}
          <div className="Tracklist">
            {tracks.map((t, i) => {
              return (
                <div key={t.id} className="Track">{i+1}. {t.title}</div>
              )
            })}
          </div>

          <br/>
          <div className="ModalFooter">
            <button 
              className="HoverButtonRed"
              onClick={closeAction}>
              <FaXmark/>
              Close page
            </button>
            {(tracks.length > 0) &&
              <button 
                className="HoverButtonGreen"
                onClick={() => {
                  downloadAlbum();
                  closeAction();
                }}>
                <FaDownload/>
                Add to library
              </button>
            }
          </div>
        </motion.div>
      </div>
    }
    </AnimatePresence>
  )
}

export default AlbumViewer
