"use client"
import { useState } from "react";
import Browser from "./components/Browser/Browser";
import { LoadingCtx, OpenAlbumCtx, OpenQueueCtx } from "./context"
import { DisplayItem } from "@/lib/interfaces";
import AlbumViewer from "./components/AlbumViewer/AlbumViewer";
import Queue from "./components/Queue/Queue";
import Loading from "./components/Loading/Loading";

export default function Home() {
  return (
    <div>
      <OpenAlbumCtx.Provider value={useState<DisplayItem|null>(null)}>
        <OpenQueueCtx.Provider value={useState<boolean>(false)}>
          <LoadingCtx.Provider value={useState<boolean>(false)}>

            <Loading />
            <AlbumViewer />
            <Queue/>
            <Browser/>

          </LoadingCtx.Provider>
        </OpenQueueCtx.Provider>
      </OpenAlbumCtx.Provider>
    </div>
  );
}
