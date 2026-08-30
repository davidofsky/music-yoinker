import { FaDownload, FaHourglass, FaTrash } from 'react-icons/fa';
import { Card, Flex, Progress, Typography } from 'antd';
import { ITrack } from '@/app/interfaces/track.interface';

const { Text } = Typography;

interface QueueItemRowProps {
  track: ITrack;
  isDownloading: boolean;
  onRemove: (trackId: number) => void;
}

export function QueueItemRow({ track, isDownloading, onRemove }: QueueItemRowProps) {
  return (
    <Card
      size="small"
      style={isDownloading ? { background: 'rgba(74,158,255,0.08)', borderColor: 'rgba(74,158,255,0.4)' } : undefined}
    >
      <Flex align="center" gap="small">
        {isDownloading ? <FaDownload /> : <FaHourglass />}
        <Text ellipsis style={{ flex: 1 }}>{track.title}</Text>
        {!isDownloading && (
          <FaTrash style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => onRemove(track.id)} />
        )}
      </Flex>
      {isDownloading && (
        <Progress percent={100} showInfo={false} status="active" size="small" style={{ marginBottom: 0 }} />
      )}
    </Card>
  );
}
