"use client"
import { useState, Suspense } from "react";
import Browser from "./components/Browser/Browser";
import { LoadingCtx, OpenAlbumCtx, OpenQueueCtx, OpenArtistCtx } from "./context"
import { DisplayItem } from "@/lib/interfaces";
import AlbumViewer from "./components/AlbumViewer/AlbumViewer";
import Queue from "./components/Queue/Queue";
import Loading from "./components/Loading/Loading";
import ArtistViewer from "./components/ArtistViewer/ArtistViewer";
import { IArtist } from "./interfaces/artist.interface";

export default function Home() {
  return (
    <div>
      <OpenAlbumCtx.Provider value={useState<DisplayItem|null>(null)}>
        <OpenArtistCtx.Provider value={useState<IArtist|null>(null)}>
          <OpenQueueCtx.Provider value={useState<boolean>(false)}>
            <LoadingCtx.Provider value={useState<boolean>(false)}>

              <Loading />
              <AlbumViewer />
              <ArtistViewer />
              <Queue />

              <Suspense fallback={<div>Loading...</div>}>
                <Browser />
              </Suspense>

            </LoadingCtx.Provider>
          </OpenQueueCtx.Provider>
        </OpenArtistCtx.Provider>
      </OpenAlbumCtx.Provider>
    </div>
  );
}
