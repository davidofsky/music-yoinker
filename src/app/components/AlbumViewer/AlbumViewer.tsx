import { FaDownload } from 'react-icons/fa'
import "./AlbumViewer.css"
import axios from "axios"
import { FaXmark } from "react-icons/fa6"

import { OpenAlbumCtx } from "@/app/context"
import { useContext } from "react"
import Modal from "../Modal/Modal"

const AlbumViewer = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!
  const closeAction = () => setOpenAlbum(null);

  const downloadAlbum = async () => {
    axios.post("/api/tracks", openAlbum?.Tracks)
  }

  return (
    <Modal isOpen={!!openAlbum} onClose={closeAction}>
      <h1 className="ModalTitle">{openAlbum?.Title} ({openAlbum?.ReleaseDate?.split("-")[0]})</h1>
      <h1 className="ModalSubTitle">{openAlbum?.Artist}</h1>
      <h1>Tracks</h1>

      <div className="Tracklist">
        {openAlbum?.Tracks.map((t, i) => {
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
    </Modal>
  )
}

export default AlbumViewer
