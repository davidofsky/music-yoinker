"use client"
import { useContext, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flex, Layout, Segmented, Typography, theme } from "antd";
import SearchBar from "../SearchBar/SearchBar";
import ChromaGrid, { ChromaItem } from "../../reactbits/ChromaGrid";
import { OpenQueueCtx, OpenAlbumCtx, LoadingCtx } from "@/app/context";
import { useOpenAlbum } from "@/app/hooks/useOpenAlbum";
import { useQueue } from "@/app/hooks/useQueue";
import { albumToChromaItem, CHROMA_GRID_CONFIG, GRID_CONTENT_STYLE } from "@/app/utils/chromaMappers";

import axios from "axios";
import { ITrack } from "@/app/interfaces/track.interface";
import { IAlbum } from "@/app/interfaces/album.interface";
import { IArtist } from "@/app/interfaces/artist.interface";

const { Header, Content } = Layout;
const { Title } = Typography;
const { useToken } = theme;

export enum BrowseMode {
  Albums,
  Tracks,
  Artists
}

const Browser = () => {
  const [openAlbum, setOpenAlbum] = useContext(OpenAlbumCtx)!;
  const [openQueue] = useContext(OpenQueueCtx)!;
  const [loading, setLoading] = useContext(LoadingCtx)!;
  const { openAlbum: openAlbumFromHook } = useOpenAlbum();
  const queuedTracks = useQueue();
  const { token } = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [browseMode, setBrowseMode] = useState<BrowseMode>(BrowseMode.Albums)
  const [albums, setAlbums] = useState<Array<IAlbum>>([])
  const [tracks, setTracks] = useState<Array<ITrack>>([])
  const [artists, setArtists] = useState<Array<IArtist>>([])
  const downloadingAlbumIds = new Set(
    queuedTracks
      .map(track => track.album?.id)
      .filter((albumId): albumId is number => albumId !== undefined)
  );
  const downloadingTrackIds = new Set(queuedTracks.map(track => track.id));

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

  useEffect(() => {
    const query = searchParams.get('q');
    if (query && (browseMode === BrowseMode.Albums || browseMode === BrowseMode.Tracks)) {
      performSearch(query, browseMode);
    }
  }, [queuedTracks]);

  const performSearch = async (query: string, mode: BrowseMode) => {
    setLoading(true);
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
    setLoading(false);
  }

  const TrackToCI = (track: ITrack, isDownloading = false) : ChromaItem => {
    return {
      image: track.artwork,
      artist: track.artist.name,
      title: track.title,
      borderColor: "#aaa",
      gradient: `linear-gradient(145deg, ${track.album.vibrantColor || "#1f1f1f"}, #000000)`,
      isDownloaded: track.isDownloaded,
      isDownloading,
      onClick: (() => {
        setOpenAlbum({
          Title: track.album.title,
          Artist: track.artist.name,
          Type: "Single",
          Tracks: [track]
        });
      })
    }
  }

  const ArtistToCI = (artist: IArtist) : ChromaItem => {
    return {
      image: artist.picture,
      title: artist.name,
      borderColor: "#aaa",
      gradient: "linear-gradient(145deg, #1f1f1f, #000000)",
      onClick: (() => {
        const url = artist.source ? `/artist/${artist.id}?source=${artist.source}` : `/artist/${artist.id}`;
        router.push(url);
      })
    }
  }

  const getItemsForMode = (): ChromaItem[] => {
    switch (browseMode) {
      case BrowseMode.Albums:
        return albums.map(a => albumToChromaItem(a, openAlbumFromHook, downloadingAlbumIds.has(a.id)));
      case BrowseMode.Tracks:
        return tracks.map(track => TrackToCI(track, downloadingTrackIds.has(track.id)));
      case BrowseMode.Artists:
        return artists.map(ArtistToCI);
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', filter: (loading || openAlbum || openQueue) ? 'blur(8px)' : undefined }}>
      <Header style={{ height: 'auto', lineHeight: 'normal', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <Flex vertical align="center" gap="middle" style={{ padding: '24px 0' }}>
          <Title style={{ margin: 0, fontFamily: 'var(--font-bbh-bogle)' }}>
            YOINKER
          </Title>

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
        <ChromaGrid
          items={getItemsForMode()}
          damping={CHROMA_GRID_CONFIG.damping}
          fadeOut={CHROMA_GRID_CONFIG.fadeOut}
          ease={CHROMA_GRID_CONFIG.ease}
          columns={CHROMA_GRID_CONFIG.columns}
        />
      </Content>
    </Layout>
  )
}
export default Browser;