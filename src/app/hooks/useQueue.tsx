import { useContext, useEffect, useState } from 'react';
import { QueueCtx } from '../context';
import { ITrack } from '../interfaces/track.interface';

export function QueueStateProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<ITrack[]>([]);

  useEffect(() => {
    const es = new EventSource('/api/stream?topic=queue');

    es.onopen = () => {
      console.info("Connected to queue stream")
    }

    es.onmessage = (e) => {
      if (!e.data) return;
      const data: typeof queue = JSON.parse(e.data);
      console.log(data)
      setQueue(data);
    };

    return () => es.close();
  }, []);

  return <QueueCtx.Provider value={queue}>{children}</QueueCtx.Provider>;
}

export function useQueue(): ITrack[] {
  const queue = useContext(QueueCtx);
  if (queue === undefined) {
    throw new Error('useQueue must be used within QueueStateProvider');
  }
  return queue;
}

