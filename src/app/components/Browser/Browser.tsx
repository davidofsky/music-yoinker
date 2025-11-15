"use client"
import { useContext, useState } from "react";
import SearchBar from "../SearchBar/SearchBar";
import { Album, Track } from "@/lib/interfaces";
import ChromaGrid, { ChromaItem } from "../../reactbits/ChromaGrid";
import { OpenQueueCtx, OpenAlbumCtx, LoadingCtx } from "@/app/context";

import "./Browser.css"
import axios from "axios";

export enum BrowseMode {
  Albums,
  Tracks,
  Artists
}

const Browser = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!;
  const [openQueue]= useContext(OpenQueueCtx)!;
  const [loading, setLoading] = useContext(LoadingCtx)!;

  const [browseMode, setBrowseMode] = useState<BrowseMode>(BrowseMode.Albums)
  const [albums, setAlbums] = useState<Array<Album>>([])
  const [tracks, setTracks] = useState<Array<Track>>([])

  const AlbumToCI = (album: Album) : ChromaItem => {
    return {
      image: album.artwork,
      subtitle: album.artists[0].name,
      title: album.title,
      borderColor: "#aaa",
      gradient: "linear-gradient(145deg, #1f1f1f, #000000)",
      onClick: (async () => {
        setLoading(true)
        const result = await axios.get("/api/album", {
          params: { id: album.id }
        })
        setLoading(false)
        
        setOpenAlbum({
          Title: album.title,
          Artist: album.artists[0].name,
          Type: "Album",
          Tracks: result.data
        })
      })
    }
  }

  const TrackToCI = (track: Track) : ChromaItem => {
    return {
      image: track.artwork,
      subtitle: track.artist,
      title: track.title,
      borderColor: "#aaa",
      gradient: "linear-gradient(145deg, #1f1f1f, #000000)",
      onClick: (() => {
        setOpenAlbum({
          Title: track.album,
          Artist: track.artist,
          Type: "Single",
          Tracks: [track]
        })
      })
    }
  }

  return (
    <div>
      <div className={(loading||openAlbum||openQueue)? "Browser Blur" : "Browser"}>
        <h1 className="Title">
          Music Yoinker
        </h1>

        <SearchBar browseMode={browseMode} setAlbums={setAlbums} setTracks={setTracks} /> 
        <br/>
        <p>
          <label>Browse </label>
          <select onChange={(e) => {
            if (e.currentTarget.value==="albums") {
              setBrowseMode(BrowseMode.Albums)
            } else if (e.currentTarget.value==="singles") {
              setBrowseMode(BrowseMode.Tracks)
            } else if (e.currentTarget.value==="artists") {
              setBrowseMode(BrowseMode.Artists)
            }
          }}>
            <option value="albums">
              <span>Albums</span>
            </option>
            <option value="singles">
              <span>Singles</span>
            </option>
            <option value="artists">
              <span>Artists</span>
            </option>
          </select>
        </p>

        {(browseMode === BrowseMode.Albums) &&
          <div>
            <br/>
            <ChromaGrid 
              items={albums.map(AlbumToCI)}
              damping={0.45}
              fadeOut={0.6}
              ease="power3.out"
              columns={4}
            />
          </div>
        }
        {(browseMode === BrowseMode.Tracks) &&
          <div>
            <br/>
            <ChromaGrid 
              items={tracks.map(TrackToCI)}
              damping={0.45}
              fadeOut={0.6}
              ease="power3.out"
              columns={4}
            />
          </div>
        }
      </div>

    </div>
  )
}
export default Browser;
