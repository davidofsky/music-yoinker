"use client"
import { FaTasks } from 'react-icons/fa'
import { useQueue } from '@/app/hooks/useQueue';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Drawer, Flex, FloatButton, Typography } from 'antd';
import { OpenQueueCtx } from '@/app/context';
import { useGroupedQueue } from '@/app/hooks/useGroupedQueue';
import { QueueItemRow } from './QueueItemRow';
import { QueuedGroup } from './QueuedGroup';

const { Text } = Typography;

const Queue = () => {
  const [openQueue, setOpenQueue] = useContext(OpenQueueCtx)!;
  const queuedTracks = useQueue();
  const [currentDownload, setCurrentDownload] = useState<string|null>(null);
  const { groupedQueue } = useGroupedQueue(queuedTracks);

  useEffect(() => {
    if (queuedTracks.length > 0) {
      const firstTrack = queuedTracks[0];
      const albumName = firstTrack.album?.title;
      setCurrentDownload(albumName ? `${firstTrack.title} - ${albumName}` : firstTrack.title);
    } else {
      setCurrentDownload(null);
    }
  }, [queuedTracks]);

  const removeTrack = async (trackId: number) => {
    try {
      await axios.delete("/api/track", { params: { id: trackId } });
    } catch (err) {
      console.error('Failed to remove track:', err);
    }
  }

  const getGlobalTrackIndex = (groupIndex: number, trackIndexInGroup: number) => {
    let globalIndex = 0;
    for (let i = 0; i < groupIndex; i++) {
      globalIndex += groupedQueue[i].tracks.length;
    }
    return globalIndex + trackIndexInGroup;
  }

  const renderQueueItem = (group: typeof groupedQueue[number], groupIndex: number) => {
    if (group.type === 'album') {
      return (
        <QueuedGroup
          key={`album-${group.albumId}`}
          title={group.albumName}
          tracks={group.tracks}
          getGlobalTrackIndex={(trackIndex) => getGlobalTrackIndex(groupIndex, trackIndex)}
          onRemoveTrack={removeTrack}
        />
      );
    } else {
      const track = group.tracks[0];
      const globalIndex = getGlobalTrackIndex(groupIndex, 0);
      return (
        <QueueItemRow
          key={track.id}
          track={track}
          isDownloading={globalIndex === 0}
          onRemove={removeTrack}
        />
      );
    }
  }

  return (
    <>
      <Drawer
        title={`Download queue ${queuedTracks.length > 0 ? `(${queuedTracks.length} remaining)` : ''}`}
        open={openQueue}
        onClose={() => setOpenQueue(false)}
      >
        <Flex vertical gap="small">
          {queuedTracks.length === 0 ? (
            <Text type="secondary">Queue is empty</Text>
          ) : (
            groupedQueue.map((group, groupIndex) => renderQueueItem(group, groupIndex))
          )}
        </Flex>
      </Drawer>
      <FloatButton
        icon={<FaTasks />}
        tooltip={currentDownload ?? "Queue is empty"}
        shape="square"
        onClick={() => setOpenQueue(true)}
        badge={{ count: queuedTracks.length, overflowCount: 99 }}
      />
    </>
  )
}

export default Queue;
