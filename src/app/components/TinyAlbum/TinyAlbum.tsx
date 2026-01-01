import { Album } from "@/lib/interfaces";

import "./TinyAlbum.css"
import { FaEye, FaCheckCircle } from "react-icons/fa";
import { useContext } from "react";
import { LoadingCtx, OpenAlbumCtx } from "@/app/context";
import { useOpenAlbum } from "@/app/hooks/useOpenAlbum";

type Props = {
  album: Album,
}

const TinyAlbum = ({album}: Props) => {
  const [, setLoading] = useContext(LoadingCtx)!;
  const { openAlbum } = useOpenAlbum();

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
        onClick={() => openAlbum(album)}>
        <FaEye/>
        View
      </button>
    </div>
  )
}

export default TinyAlbum;
