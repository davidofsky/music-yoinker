import { Track } from '@/lib/interfaces';
import { useEffect, useState } from 'react';

export function useQueue() : Track[] {
  const [queue, setQueue] = useState<Track[]>([]);

  useEffect(() => {
    const es = new EventSource('/api/queue/stream');

    es.onopen = () => {
      console.info("Connected to queue stream")
    }

    es.onmessage = (e) => {
      console.log(e)
      if (!e.data) return;
      const data: typeof queue = JSON.parse(e.data);
      console.log(data)
      setQueue(data);
    };

    return () => es.close();
  }, []);

  return queue;
}

