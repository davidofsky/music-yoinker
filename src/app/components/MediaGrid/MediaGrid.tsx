"use client"
import { CSSProperties, useContext, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import ChromaGrid, { ChromaItem } from "@/app/reactbits/ChromaGrid";
import { OpenAlbumCtx } from "@/app/context";
import { useOpenAlbum } from "@/app/hooks/useOpenAlbum";
import { useQueue } from "@/app/hooks/useQueue";
import { IAlbum } from "@/app/interfaces/album.interface";
import { ITrack } from "@/app/interfaces/track.interface";
import { IArtist } from "@/app/interfaces/artist.interface";

export const GRID_CONTENT_STYLE: CSSProperties = { padding: '32px 24px', display: 'flex', justifyContent: 'center' };

const GRID_CONFIG = {
  damping: 0.45,
  fadeOut: 0.6,
  ease: "power3.out" as const,
  columns: 4
};

const BORDER_COLOR = "#aaa";

const gradientFrom = (color?: string | null) =>
  color ? `linear-gradient(145deg, ${color}, #000000)` : undefined;

/**
 * Every card grid in the app goes through here, so all cards get the same behaviour:
 * click to open, a spinner while anything of theirs is in the download queue, and a
 * checkmark once it is in the library. Albums and singles can be downloaded, so those
 * grids must say how to reload their items when a download of theirs finishes.
 */
export type MediaGridProps =
  | { kind: 'album'; items: IAlbum[]; onDownloadsFinished: () => void }
  | { kind: 'track'; items: ITrack[]; onDownloadsFinished: () => void }
  | { kind: 'artist'; items: IArtist[] };

const MediaGrid = (props: MediaGridProps) => {
  const [, setOpenAlbum] = useContext(OpenAlbumCtx)!;
  const { openAlbum } = useOpenAlbum();
  const queue = useQueue();
  const router = useRouter();

  // Ids of the grid's items that currently have tracks in the download queue.
  const downloadingIds = useMemo(() => {
    const ids = new Set<number>();
    if (props.kind === 'artist') return ids;
    const shown = new Set<number>(props.items.map(item => item.id));
    for (const track of queue) {
      const id = props.kind === 'album' ? track.album?.id : track.id;
      if (id !== undefined && shown.has(id)) ids.add(id);
    }
    return ids;
  }, [queue, props.kind, props.items]);

  // When something of ours leaves the queue, reload so the server tells us it is downloaded.
  const previousDownloading = useRef<Set<number>>(new Set());
  const onDownloadsFinished = props.kind === 'artist' ? undefined : props.onDownloadsFinished;
  useEffect(() => {
    const finished = [...previousDownloading.current].some(id => !downloadingIds.has(id));
    previousDownloading.current = downloadingIds;
    if (finished) onDownloadsFinished?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [downloadingIds]);

  const items: ChromaItem[] = (() => {
    switch (props.kind) {
      case 'album':
        return props.items.map(album => ({
          image: album.artwork,
          title: album.title,
          artist: album.artists[0]?.name,
          year: album.releaseDate?.split("-")[0],
          borderColor: BORDER_COLOR,
          gradient: gradientFrom(album.vibrantColor),
          isDownloaded: album.isDownloaded,
          isDownloading: !album.isDownloaded && downloadingIds.has(album.id),
          onClick: () => openAlbum(album),
        }));
      case 'track':
        return props.items.map(track => ({
          image: track.artwork,
          title: track.title,
          artist: track.artist.name,
          year: track.releaseDate?.split("-")[0],
          borderColor: BORDER_COLOR,
          gradient: gradientFrom(track.album?.vibrantColor),
          isDownloaded: track.isDownloaded,
          isDownloading: !track.isDownloaded && downloadingIds.has(track.id),
          onClick: () => setOpenAlbum({
            Title: track.album.title,
            Artist: track.artist.name,
            Type: "Single",
            Tracks: [track],
            ReleaseDate: track.releaseDate,
          }),
        }));
      case 'artist':
        return props.items.map(artist => ({
          image: artist.picture,
          title: artist.name,
          borderColor: BORDER_COLOR,
          gradient: "linear-gradient(145deg, #1f1f1f, #000000)",
          onClick: () => router.push(
            artist.source ? `/artist/${artist.id}?source=${artist.source}` : `/artist/${artist.id}`
          ),
        }));
    }
  })();

  return (
    <ChromaGrid
      items={items}
      damping={GRID_CONFIG.damping}
      fadeOut={GRID_CONFIG.fadeOut}
      ease={GRID_CONFIG.ease}
      columns={GRID_CONFIG.columns}
    />
  );
};

export default MediaGrid;
