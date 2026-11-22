"use client"
import { useContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Flex, Layout, Segmented, theme } from "antd";
import Logo from "../Logo/Logo";
import DiscoverBanner from "../DiscoverBanner/DiscoverBanner";
import SearchBar from "../SearchBar/SearchBar";
import MediaGrid, { GRID_CONTENT_STYLE } from "../MediaGrid/MediaGrid";
import { OpenQueueCtx, OpenAlbumCtx, LoadingCtx } from "@/app/context";

import axios from "axios";
import { ITrack } from "@/app/interfaces/track.interface";
import { IAlbum } from "@/app/interfaces/album.interface";
import { IArtist } from "@/app/interfaces/artist.interface";

const { Header, Content } = Layout;
const { useToken } = theme;

export enum BrowseMode {
  Albums,
  Tracks,
  Artists
}

const Browser = () => {
  const [openAlbum] = useContext(OpenAlbumCtx)!;
  const [openQueue] = useContext(OpenQueueCtx)!;
  const [loading, setLoading] = useContext(LoadingCtx)!;
  const { token } = useToken();
  const searchParams = useSearchParams();

  const [browseMode, setBrowseMode] = useState<BrowseMode>(BrowseMode.Albums)
  const [albums, setAlbums] = useState<Array<IAlbum>>([])
  const [tracks, setTracks] = useState<Array<ITrack>>([])
  const [artists, setArtists] = useState<Array<IArtist>>([])

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

  const performSearch = async (query: string, mode: BrowseMode, silent = false) => {
    if (!silent) setLoading(true);
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
    if (!silent) setLoading(false);
  }

  const refreshResults = () => {
    const query = searchParams.get('q');
    if (query) performSearch(query, browseMode, true);
  }

  return (
    <Layout style={{ minHeight: '100vh', filter: (loading || openAlbum || openQueue) ? 'blur(8px)' : undefined }}>
      <Header style={{ height: 'auto', lineHeight: 'normal', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <Flex vertical align="center" gap="middle" style={{ padding: '24px 0' }}>
          <Logo />

          <Flex wrap align="center" justify="center" gap="middle">
            <SearchBar
              browseMode={browseMode}
              setAlbums={setAlbums}
              setTracks={setTracks}
              setArtists={setArtists}/>

            <Segmented
              value={browseMode}
              onChange={(value) => {
                const newMode = value as BrowseMode;
                setBrowseMode(newMode);

                const query = searchParams.get('q');
                if (query) {
                  const modeString = newMode === BrowseMode.Albums ? 'albums' : newMode === BrowseMode.Tracks ? 'singles' : 'artists';
                  const newParams = new URLSearchParams();
                  newParams.set('q', query);
                  newParams.set('mode', modeString);
                  window.history.replaceState({}, '', `?${newParams.toString()}`);
                }
              }}
              options={[
                { label: "Albums", value: BrowseMode.Albums },
                { label: "Singles", value: BrowseMode.Tracks },
                { label: "Artists", value: BrowseMode.Artists },
              ]}
            />
          </Flex>
        </Flex>
      </Header>

      <Content style={GRID_CONTENT_STYLE}>
        {!searchParams.get('q') && <DiscoverBanner />}
        {searchParams.get('q') && browseMode === BrowseMode.Albums && (
          <MediaGrid kind="album" items={albums} onDownloadsFinished={refreshResults} />
        )}
        {searchParams.get('q') && browseMode === BrowseMode.Tracks && (
          <MediaGrid kind="track" items={tracks} onDownloadsFinished={refreshResults} />
        )}
        {searchParams.get('q') && browseMode === BrowseMode.Artists && (
          <MediaGrid kind="artist" items={artists} />
        )}
      </Content>
    </Layout>
  )
}
export default Browser;