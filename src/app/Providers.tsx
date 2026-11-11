"use client"
import { useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntdThemeProvider from "./AntdThemeProvider";
import { LoadingCtx, OpenAlbumCtx, OpenQueueCtx } from "./context";
import { DisplayItem } from "@/lib/interfaces";
import AlbumViewer from "./components/AlbumViewer/AlbumViewer";
import Queue from "./components/Queue/Queue";
import Loading from "./components/Loading/Loading";
import { QueueStateProvider } from "./hooks/useQueue";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    // When on the login page, don't load in the AppState because that would cause unnecesarry 401 errors
    <AntdRegistry>
      <AntdThemeProvider>
        {(usePathname() === "/login") ? children : <AppState>{children}</AppState>}
      </AntdThemeProvider>
    </AntdRegistry>
  );
};

const AppState = ({ children }: { children: ReactNode }) => {
  return (
    <OpenAlbumCtx.Provider value={useState<DisplayItem | null>(null)}>
      <OpenQueueCtx.Provider value={useState<boolean>(false)}>
        <LoadingCtx.Provider value={useState<boolean>(false)}>
          <QueueStateProvider>
            <Loading />
            <AlbumViewer />
            <Queue />
            {children}
          </QueueStateProvider>
        </LoadingCtx.Provider>
      </OpenQueueCtx.Provider>
    </OpenAlbumCtx.Provider>
  );
};

export default Providers;