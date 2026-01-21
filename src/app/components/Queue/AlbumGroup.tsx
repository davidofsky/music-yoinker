import { QueueItemRow } from './QueueItemRow';
import { ITrack } from '@/app/interfaces/track.interface';

interface AlbumGroupProps {
  albumName?: string;
  tracks: ITrack[];
  getGlobalTrackIndex: (trackIndexInGroup: number) => number;
  onRemoveTrack: (trackId: number) => void;
}

export function AlbumGroup({ albumName, tracks, getGlobalTrackIndex, onRemoveTrack }: AlbumGroupProps) {
  return (
    <div className='AlbumGroup'>
      <div className='AlbumGroupHeader'>
        <p className='AlbumGroupTitle'>{albumName}</p>
        <span className='AlbumTrackCount'>{tracks.length} tracks</span>
      </div>
      <div className='AlbumGroupTracks'>
        {tracks.map((track, trackIndex) => (
          <QueueItemRow
            key={track.id}
            track={track}
            isDownloading={getGlobalTrackIndex(trackIndex) === 0}
            onRemove={onRemoveTrack}
          />
        ))}
      </div>
    </div>
  );
}
