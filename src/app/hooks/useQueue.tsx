import { useEffect, useState } from 'react';
import { ITidalTrack } from '../interfaces/tidal-track.interface';

export function useQueue() : ITidalTrack[] {
  const [queue, setQueue] = useState<ITidalTrack[]>([]);

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

