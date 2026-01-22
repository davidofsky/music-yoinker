"use client"
import { FaTasks } from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6';
import { useQueue } from '@/app/hooks/useQueue';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LoadingCtx, OpenAlbumCtx, OpenArtistCtx, OpenQueueCtx } from '@/app/context';
import Modal from '@/app/components/Modal/Modal';
import "./Queue.css"
import { useGroupedQueue } from '@/app/hooks/useGroupedQueue';
import { QueueItemRow } from './QueueItemRow';
import { QueuedGroup } from './QueuedGroup';

const Queue = () => {
  const [openQueue, setOpenQueue] = useContext(OpenQueueCtx)!;
  const [loading] = useContext(LoadingCtx)!;
  const [openAlbum] = useContext(OpenAlbumCtx)!;
  const [openArtist] = useContext(OpenArtistCtx)!;
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
      <Modal isOpen={openQueue} onClose={() => setOpenQueue(false)}>
        <h1 className='ModalTitle'>Download queue {queuedTracks.length > 0 && `(${queuedTracks.length} remaining)`}</h1>
        <div className='QueuedList'>
          {queuedTracks.length === 0 ? (
            <p className='EmptyQueue'>Queue is empty</p>
          ) : (
            groupedQueue.map((group, groupIndex) => renderQueueItem(group, groupIndex))
          )}
        </div>
        <div className='ModalFooter'>
          <button
            className="HoverButtonRed"
            onClick={() => setOpenQueue(false)}>
            <FaXmark/>
            Close page
          </button>
        </div>
      </Modal>
      <div
        className={`Queue ${loading || openAlbum || openQueue || openArtist ? 'blur' : ''}`}
        onClick={() => setOpenQueue(true)}>
        <FaTasks/>
        {currentDownload ? (
          <p>{currentDownload}</p>
        ) : (
          <p>Queue is empty</p>
        )}
      </div>
    </>
  )
}

export default Queue;
