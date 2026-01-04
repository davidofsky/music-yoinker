import { Track } from '@/lib/interfaces';
import { useEffect, useState } from 'react';

export function useQueue() : Track[] {
  const [queue, setQueue] = useState<Track[]>([]);

  useEffect(() => {
    const es = new EventSource('/api/queue/stream');

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setQueue(data.queue);
    };

    return () => es.close();
  }, []);

  return queue;
}

