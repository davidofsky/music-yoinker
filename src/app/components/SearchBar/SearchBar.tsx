"use client"
import { Album, Artist, Track } from "@/lib/interfaces";
import axios from "axios";
import { useRef, Dispatch, SetStateAction, useContext, useEffect } from "react";
import {FaSearch} from 'react-icons/fa'
import { LoadingCtx } from "@/app/context";
import { BrowseMode } from "../Browser/Browser"

import "./SearchBar.css"

type Props = {
  browseMode: BrowseMode,
  setAlbums: Dispatch<SetStateAction<Album[]>>,
  setTracks: Dispatch<SetStateAction<Track[]>>
  setArtists: Dispatch<SetStateAction<Artist[]>>
}

const SearchBar = (props: Props) => {
  const [_loading, setLoading ]= useContext(LoadingCtx)!;
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const stateSetterConfig = {
    [BrowseMode.Albums]: { endpoint: "/api/albums", setter: props.setAlbums },
    [BrowseMode.Tracks]: { endpoint: "/api/tracks", setter: props.setTracks },
    [BrowseMode.Artists]: { endpoint: "/api/artists", setter: props.setArtists }
  };

  const search = async () => {
    if (!searchRef.current) throw new Error ("No reference found to searchbar");
    const query = searchRef.current.value;
    if (query.trim().length === 0) return;
    setLoading(true);

    const { endpoint, setter } = stateSetterConfig[props.browseMode];
    const result = await axios.get(endpoint, { params: { query } });
    setter(result.data);

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
