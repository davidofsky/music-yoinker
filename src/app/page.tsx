"use client"
import { useState } from "react";
import Browser from "./components/Browser/Browser";
import { LoadingCtx, OpenAlbumCtx, OpenQueueCtx, OpenArtistCtx } from "./context"
import { Artist, DisplayItem } from "@/lib/interfaces";
import AlbumViewer from "./components/AlbumViewer/AlbumViewer";
import Queue from "./components/Queue/Queue";
import Loading from "./components/Loading/Loading";
import ArtistViewer from "./components/ArtistViewer/ArtistViewer";

export default function Home() {
  return (
    <div>
      <OpenAlbumCtx.Provider value={useState<DisplayItem|null>(null)}>
        <OpenArtistCtx.Provider value={useState<Artist|null>(null)}>
          <OpenQueueCtx.Provider value={useState<boolean>(false)}>
            <LoadingCtx.Provider value={useState<boolean>(false)}>

              <Loading />
              <AlbumViewer />
              <ArtistViewer />
              <Queue />
              <Browser />

            </LoadingCtx.Provider>
          </OpenQueueCtx.Provider>
        </OpenArtistCtx.Provider>
      </OpenAlbumCtx.Provider>
    </div>
  );
}
