"use client"
import { useState, ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdThemeProvider from "./AntdThemeProvider";
import { LoadingCtx, OpenAlbumCtx, OpenQueueCtx } from "./context";
import { DisplayItem } from "@/lib/interfaces";
import AlbumViewer from "./components/AlbumViewer/AlbumViewer";
import Queue from "./components/Queue/Queue";
import Loading from "./components/Loading/Loading";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <AntdRegistry>
      <AntdThemeProvider>
        <OpenAlbumCtx.Provider value={useState<DisplayItem | null>(null)}>
          <OpenQueueCtx.Provider value={useState<boolean>(false)}>
            <LoadingCtx.Provider value={useState<boolean>(false)}>
              <Loading />
              <AlbumViewer />
              <Queue />
              {children}
            </LoadingCtx.Provider>
          </OpenQueueCtx.Provider>
        </OpenAlbumCtx.Provider>
      </AntdThemeProvider>
    </AntdRegistry>
  );
};

export default Providers;
