"use client"
import { Album } from "@/lib/interfaces";
import axios from "axios";
import { useRef, Dispatch, SetStateAction, useContext } from "react";
import {FaSearch} from 'react-icons/fa'
import { LoadingCtx } from "@/app/context";

import "./SearchBar.css"

type Props = {
  setAlbums: Dispatch<SetStateAction<Album[]>>
}

const SearchBar = (props: Props) => {
  const [_loading, setLoading ]= useContext(LoadingCtx)!;
  const searchRef = useRef<HTMLInputElement>(null);

  const search = async () => { 
    if (!searchRef.current) throw new Error ("No reference found to searchbar");
    setLoading(true);
    const query = searchRef.current.value;

    const result = await axios.get("/api/albums", {
      params: { query }
    })

    const albums: Album[] = result.data;
    props.setAlbums(albums);
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
