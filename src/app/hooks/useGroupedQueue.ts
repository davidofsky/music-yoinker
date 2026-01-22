import { useMemo, useRef } from 'react';
import { ITrack } from '@/app/interfaces/track.interface';

export interface QueueGroup {
  type: 'album' | 'track';
  albumId?: number;
  albumName?: string;
  tracks: ITrack[];
}

export function useGroupedQueue(queuedTracks: ITrack[]): { groupedQueue: QueueGroup[]; albumsWithMultipleTracks: Set<number> } {
  const albumsWithMultipleTracksRef = useRef(new Set<number>());

  const groupedQueue = useMemo(() => {
    if (queuedTracks.length === 0) {
      albumsWithMultipleTracksRef.current.clear();
      return [];
    }

    // First pass: count tracks per album
    const albumTrackCount = new Map<number, number>();
    const albumNames = new Map<number, string>();

    queuedTracks.forEach(track => {
      if (track.album?.id !== undefined) {
        albumTrackCount.set(track.album.id, (albumTrackCount.get(track.album.id) ?? 0) + 1);
        albumNames.set(track.album.id, track.album.title);
      }
    });

    // Update ref with albums that have multiple tracks
    albumTrackCount.forEach((count, albumId) => {
      if (count > 1) {
        albumsWithMultipleTracksRef.current.add(albumId);
      }
    });

    // Second pass: group consecutive tracks from the same album
    const groups: QueueGroup[] = [];
    let currentGroup: ITrack[] = [queuedTracks[0]];
    let currentAlbumId = queuedTracks[0].album?.id;

    for (let i = 1; i < queuedTracks.length; i++) {
      const track = queuedTracks[i];
      const trackAlbumId = track.album?.id;

      if (trackAlbumId && currentAlbumId && trackAlbumId === currentAlbumId) {
        currentGroup.push(track);
      } else {
        groups.push(...createGroupEntries(currentAlbumId, currentGroup, albumNames, albumsWithMultipleTracksRef.current));
        currentGroup = [track];
        currentAlbumId = trackAlbumId;
      }
    }

    // Handle last group
    groups.push(...createGroupEntries(currentAlbumId, currentGroup, albumNames, albumsWithMultipleTracksRef.current));

    return groups;
  }, [queuedTracks]);

  return { groupedQueue, albumsWithMultipleTracks: albumsWithMultipleTracksRef.current };
}

function createGroupEntries(
  albumId: number | undefined,
  tracks: ITrack[],
  albumNames: Map<number, string>,
  albumsWithMultipleTracks: Set<number>
): QueueGroup[] {
  if (albumId !== undefined && albumsWithMultipleTracks.has(albumId)) {
    return [{
      type: 'album',
      albumId,
      albumName: albumNames.get(albumId),
      tracks
    }];
  }
  return tracks.map(t => ({
    type: 'track' as const,
    tracks: [t]
  }));
}
