"use client"
import { useContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "../SearchBar/SearchBar";
import { Album, Artist } from "@/lib/interfaces";
import ChromaGrid, { ChromaItem } from "../../reactbits/ChromaGrid";
import { OpenQueueCtx, OpenAlbumCtx, LoadingCtx, OpenArtistCtx } from "@/app/context";
import { useOpenAlbum } from "@/app/hooks/useOpenAlbum";

import "./Browser.css"
import axios from "axios";
import { ITidalTrack } from "@/app/interfaces/tidal-track.interface";

export enum BrowseMode {
  Albums,
  Tracks,
  Artists
}

const CHROMA_GRID_CONFIG = {
  damping: 0.45,
  fadeOut: 0.6,
  ease: "power3.out" as const,
  columns: 4
}

const Browser = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!;
  const [openArtist, setOpenArtist] = useContext(OpenArtistCtx)!;
  const [openQueue] = useContext(OpenQueueCtx)!;
  const [loading, setLoading] = useContext(LoadingCtx)!;
  const { openAlbum: openAlbumFromHook } = useOpenAlbum();
  const searchParams = useSearchParams();

  const [browseMode, setBrowseMode] = useState<BrowseMode>(BrowseMode.Albums)
  const [albums, setAlbums] = useState<Array<Album>>([])
  const [tracks, setTracks] = useState<Array<ITidalTrack>>([])
  const [artists, setArtists] = useState<Array<Artist>>([])

  useEffect(() => {
    const query = searchParams.get('q');
    const mode = searchParams.get('mode');

    if (mode) {
      const modeMap: { [key: string]: BrowseMode } = {
        'albums': BrowseMode.Albums,
        'singles': BrowseMode.Tracks,
        'artists': BrowseMode.Artists
      };
      const selectedMode = modeMap[mode] ?? BrowseMode.Albums;
      setBrowseMode(selectedMode);

      if (query) {
        performSearch(query, selectedMode);
      }
    } else if (query) {
      performSearch(query, browseMode);
    }
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      performSearch(query, browseMode);
    }
  }, [browseMode]);

  const performSearch = async (query: string, mode: BrowseMode) => {
    setLoading(true);
    const stateSetterConfig = {
      [BrowseMode.Albums]: { endpoint: "/api/albums", setter: setAlbums },
      [BrowseMode.Tracks]: { endpoint: "/api/tracks", setter: setTracks },
      [BrowseMode.Artists]: { endpoint: "/api/artists", setter: setArtists }
    };

    const { endpoint, setter } = stateSetterConfig[mode];
    try {
      const result = await axios.get(endpoint, { params: { query } });
      setter(result.data);
    } catch (error) {
      console.error("Search failed:", error);
    }
    setLoading(false);
  }

  const AlbumToCI = (album: Album) : ChromaItem => {
    return {
      image: album.artwork,
      artist: album.artists[0].name,
      year: album.releaseDate.split("-")[0],
      title: `${album.title}`,
      borderColor: "#aaa",
      gradient: "linear-gradient(145deg, "+album.color+", #000000)",
      isDownloaded: album.isDownloaded,
      onClick: () => openAlbumFromHook(album)
    }
  }

  const TrackToCI = (track: ITidalTrack) : ChromaItem => {
    return {
      image: track.artwork,
      artist: track.artist.name,
      title: track.title,
      borderColor: "#aaa",
      gradient: `linear-gradient(145deg,${track.album.vibrantColor}, #000000)`,
      isDownloaded: track.isDownloaded,
      onClick: (() => {
        setOpenAlbum({
          Title: track.album.title,
          Artist: track.artist.name,
          Type: "Single",
          Tracks: [track]
        });
      })
    }
  }

  const ArtistToCI = (artist: Artist) : ChromaItem => {
    return {
      image: artist.picture,
      title: artist.name,
      borderColor: "#aaa",
      gradient: "linear-gradient(145deg, #1f1f1f, #000000)",
      onClick: (() => {
        setOpenArtist(artist);
      })
    }
  }

  const getItemsForMode = (): ChromaItem[] => {
    switch (browseMode) {
      case BrowseMode.Albums:
        return albums.map(AlbumToCI);
      case BrowseMode.Tracks:
        return tracks.map(TrackToCI);
      case BrowseMode.Artists:
        return artists.map(ArtistToCI);
    }
  }

  return (
    <div>
      <div className={(loading||openAlbum||openQueue||openArtist)? "Browser Blur" : "Browser"}>
        <h1 className="Title">
          Music Yoinker
        </h1>

        <SearchBar
          browseMode={browseMode}
          setAlbums={setAlbums}
          setTracks={setTracks}
          setArtists={setArtists}/>
        <br/>
        <p>
          <label>Browse </label>
          <select value={
            browseMode === BrowseMode.Albums ? 'albums' :
            browseMode === BrowseMode.Tracks ? 'singles' :
            'artists'
          } onChange={(e) => {
            const newMode = e.currentTarget.value;
            if (newMode === "albums") {
              setBrowseMode(BrowseMode.Albums);
            } else if (newMode === "singles") {
              setBrowseMode(BrowseMode.Tracks);
            } else if (newMode === "artists") {
              setBrowseMode(BrowseMode.Artists);
            }

            // Update URL with new mode
            const query = searchParams.get('q');
            if (query) {
              const newParams = new URLSearchParams();
              newParams.set('q', query);
              newParams.set('mode', newMode);
              window.history.replaceState({}, '', `?${newParams.toString()}`);
            }
          }}>
            <option value="albums">Albums</option>
            <option value="singles">Singles</option>
            <option value="artists">Artists</option>
          </select>
        </p>

        <div>
          <br/>
          <ChromaGrid
            items={getItemsForMode()}
            damping={CHROMA_GRID_CONFIG.damping}
            fadeOut={CHROMA_GRID_CONFIG.fadeOut}
            ease={CHROMA_GRID_CONFIG.ease}
            columns={CHROMA_GRID_CONFIG.columns}
          />
        </div>
      </div>

    </div>
  )
}
export default Browser;
