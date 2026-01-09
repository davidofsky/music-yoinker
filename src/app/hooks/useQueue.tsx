import { useEffect, useState } from 'react';
import { ITrack } from '../interfaces/track.interface';

export function useQueue() : ITrack[] {
  const [queue, setQueue] = useState<ITrack[]>([]);

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

