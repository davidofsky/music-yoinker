"use client"
import { useContext, useState } from "react";
import SearchBar from "../SearchBar/SearchBar";
import { Album } from "@/lib/interfaces";
import ChromaGrid, { ChromaItem } from "../../reactbits/ChromaGrid";
import { OpenQueueCtx, OpenAlbumCtx, LoadingCtx } from "@/app/context";

import "./Browser.css"

const Browser = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!;
  const [openQueue]= useContext(OpenQueueCtx)!;
  const [loading] = useContext(LoadingCtx)!;

  const [albums, setAlbums] = useState<Array<Album>>([])

  const AlbumToCI = (album: Album) : ChromaItem => {
    return {
      image: album.artwork.file,
      subtitle: album.artists[0].name,
      title: album.title,
      borderColor: "#aaa",
      gradient: "linear-gradient(145deg, #1f1f1f, #000000)",
      onClick: (() => {setOpenAlbum(album)})
    }
  }

  return (
    <div>
      <div className={(loading||openAlbum||openQueue)? "Browser Blur" : "Browser"}>
        <h1 className="Title">
          Music Yoinker
        </h1>
        <SearchBar setAlbums={setAlbums} /> 
        <br/>
         <ChromaGrid 
            items={albums.map(AlbumToCI)}
            damping={0.45}
            fadeOut={0.6}
            ease="power3.out"
            columns={4}
          />
      </div>

    </div>
  )
}
export default Browser;
