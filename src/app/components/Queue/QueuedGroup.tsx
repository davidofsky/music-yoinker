import { QueueItemRow } from './QueueItemRow';
import { ITrack } from '@/app/interfaces/track.interface';

interface QueuedGroupProps {
  title?: string;
  tracks: ITrack[];
  getGlobalTrackIndex: (trackIndexInGroup: number) => number;
  onRemoveTrack: (trackId: number) => void;
}

export function QueuedGroup({ title, tracks, getGlobalTrackIndex, onRemoveTrack }: QueuedGroupProps) {
  return (
    <div className='QueuedGroup'>
      <div className='QueuedGroupHeader'>
        <p className='QueuedGroupTitle'>{title}</p>
        <span className='QueuedGroupItemCount'>{tracks.length} tracks</span>
      </div>
      <div className='QueuedGroupItems'>
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
