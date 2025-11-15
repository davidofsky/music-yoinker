import { AnimatePresence, motion } from "motion/react"
import { FaDownload } from 'react-icons/fa'
import "./AlbumViewer.css"
import axios from "axios"
import { FaXmark } from "react-icons/fa6"

import { OpenAlbumCtx } from "@/app/context"
import { useContext } from "react"

const AlbumViewer = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!
  const closeAction = () => setOpenAlbum(null);

  const downloadAlbum = async () => {
    axios.post("/api/albums", openAlbum?.Tracks)
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
        <h1 className="ModalTitle">{openAlbum.Title}</h1>
        <h1 className="ModalSubTitle">{openAlbum.Artist}</h1>
          <h1>Tracks</h1>

          <div className="Tracklist">
            {openAlbum.Tracks.map((t, i) => {
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
            <button 
              className="HoverButtonGreen"
              onClick={() => {
                downloadAlbum();
                closeAction();
              }}>
              <FaDownload/>
              Add to library
            </button>
          </div>
        </motion.div>
      </div>
    }
    </AnimatePresence>
  )
}

export default AlbumViewer
