import { Card, Flex, Typography } from 'antd';
import { QueueItemRow } from './QueueItemRow';
import { ITrack } from '@/app/interfaces/track.interface';

const { Text } = Typography;

interface QueuedGroupProps {
  title?: string;
  tracks: ITrack[];
  getGlobalTrackIndex: (trackIndexInGroup: number) => number;
  onRemoveTrack: (trackId: number) => void;
}

export function QueuedGroup({ title, tracks, getGlobalTrackIndex, onRemoveTrack }: QueuedGroupProps) {
  return (
    <Card
      size="small"
      title={<Text ellipsis style={{ maxWidth: 200 }}>{title}</Text>}
      extra={<Text type="secondary">{tracks.length} tracks</Text>}
    >
      <Flex vertical gap="small">
        {tracks.map((track, trackIndex) => (
          <QueueItemRow
            key={track.id}
            track={track}
            isDownloading={getGlobalTrackIndex(trackIndex) === 0}
            onRemove={onRemoveTrack}
          />
        ))}
      </Flex>
    </Card>
  );
}
