import { Album } from "@/lib/interfaces";

import "./TinyAlbum.css"
import { FaEye, FaCheckCircle } from "react-icons/fa";
import { useContext } from "react";
import { LoadingCtx, OpenAlbumCtx } from "@/app/context";
import axios from "axios";

type Props = {
  album: Album,
}

const TinyAlbum = ({album}: Props) => {
  const [_openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!;
  const [_loading, setLoading] = useContext(LoadingCtx)!;
  return (
    <div className="TinyAlbum">
      <img className="AlbumArtwork" src={album.artwork} alt={album.title} loading="lazy" />
      <div>
        <p className="AlbumTitle">
          {album.title} ({album.releaseDate.split('-')[0]})
          {album.isDownloaded && (
            <FaCheckCircle
              className="DownloadedIcon"
              title="Downloaded"
            />
          )}
        </p>
        <p className="AlbumArtist">{album.artists[0].name}</p>
      </div>
      <button className="HoverButtonGreen"
        onClick={async () => {
          setLoading(true)
          const result = await axios.get("/api/album", {
            params: { id: album.id }
          })
          setLoading(false)

          setOpenAlbum({
            Title: album.title,
            Artist: album.artists[0].name,
            Type: "Album",
            Tracks: result.data,
            ReleaseDate: album.releaseDate
          });
        }}>
        <FaEye/>
        View
      </button>
    </div>
  )
}

export default TinyAlbum;
