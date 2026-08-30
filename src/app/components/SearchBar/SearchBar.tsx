"use client"
import axios from "axios";
import { useRef, useState, Dispatch, SetStateAction, useContext, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, InputRef } from "antd";
import { LoadingCtx } from "@/app/context";
import { BrowseMode } from "../Browser/Browser"

import { ITrack } from "@/app/interfaces/track.interface";
import { IAlbum } from "@/app/interfaces/album.interface";
import { IArtist } from "@/app/interfaces/artist.interface";

type Props = {
  browseMode: BrowseMode,
  setAlbums: Dispatch<SetStateAction<IAlbum[]>>,
  setTracks: Dispatch<SetStateAction<ITrack[]>>
  setArtists: Dispatch<SetStateAction<IArtist[]>>
}

const SearchBar = (props: Props) => {
  const [, setLoading] = useContext(LoadingCtx)!;
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<InputRef>(null);
  const [value, setValue] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    setValue(searchParams.get('q') ?? '');
  }, [searchParams]);

  const stateSetterConfig = {
    [BrowseMode.Albums]: { endpoint: "/api/albums", setter: props.setAlbums },
    [BrowseMode.Tracks]: { endpoint: "/api/tracks", setter: props.setTracks },
    [BrowseMode.Artists]: { endpoint: "/api/artists", setter: props.setArtists }
  };

  const search = async (query: string) => {
    if (query.trim().length === 0) return;
    setLoading(true);

    const modeString =
      props.browseMode === BrowseMode.Albums ? 'albums' :
      props.browseMode === BrowseMode.Tracks ? 'singles' :
      'artists';

    router.push(`?q=${encodeURIComponent(query)}&mode=${modeString}`);

    const { endpoint, setter } = stateSetterConfig[props.browseMode];
    const result = await axios.get(endpoint, { params: { query } });
    setter(result.data);

    setLoading(false);
  }

  return (
    <Input.Search
      ref={searchRef}
      placeholder="Search"
      size="large"
      style={{ width: 320 }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onSearch={search}
    />
  )
}
export default SearchBar;
