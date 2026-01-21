import { FaDownload, FaHourglass, FaTrash } from 'react-icons/fa';
import { ITrack } from '@/app/interfaces/track.interface';

interface QueueItemRowProps {
  track: ITrack;
  isDownloading: boolean;
  onRemove: (trackId: number) => void;
}

export function QueueItemRow({ track, isDownloading, onRemove }: QueueItemRowProps) {
  return (
    <div className={`QueuedItem ${isDownloading ? 'downloading' : ''}`}>
      {isDownloading ? <FaDownload /> : <FaHourglass />}
      <p>{track.title}</p>
      {!isDownloading && (
        <FaTrash
          className='CancelQueue'
          onClick={() => onRemove(track.id)}
        />
      )}
    </div>
  );
}
