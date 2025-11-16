"use client"
import { Album, Track } from "@/lib/interfaces";
import axios from "axios";
import { useRef, Dispatch, SetStateAction, useContext } from "react";
import {FaSearch} from 'react-icons/fa'
import { LoadingCtx } from "@/app/context";
import { BrowseMode } from "../Browser/Browser"

import "./SearchBar.css"

type Props = {
  browseMode: BrowseMode,
  setAlbums: Dispatch<SetStateAction<Album[]>>,
  setTracks: Dispatch<SetStateAction<Track[]>>
}

const SearchBar = (props: Props) => {
  const [_loading, setLoading ]= useContext(LoadingCtx)!;
  const searchRef = useRef<HTMLInputElement>(null);

  const search = async () => {
    if (!searchRef.current) throw new Error ("No reference found to searchbar");
    const query = searchRef.current.value;
    if (query.trim().length === 0) return;
    setLoading(true);

    let endpoint = "/api/albums";
    if (props.browseMode === BrowseMode.Tracks) endpoint = "/api/tracks"
    const result = await axios.get(endpoint, {
      params: { query }
    });


    if (props.browseMode === BrowseMode.Albums) {
      const albums: Album[] = result.data;
      props.setAlbums(albums);
    } else if (props.browseMode === BrowseMode.Tracks) {
      const tracks: Track[] = result.data;
      props.setTracks(tracks);
    }

    setLoading(false);
  }

  return (
    <div className="SearchContainer">
      <input className="SearchBar" ref={searchRef} placeholder="Search"
        onKeyDown={(e) => {if (e.key === "Enter") search()}}/>
      <button className="SearchButton" onClick={search}>
      <FaSearch color="#ddd"/>
      </button>
    </div>
  )

}
export default SearchBar;
