import { NextRequest } from 'next/server';
import { addClient, removeClient } from '@/lib/broadcast';
import redis from '@/lib/redis';

/**
 * Create ReadableStreams and store them in Redis
 * Initially send the queue to the client
 * @returns {ReadableStream}
 */
export async function GET(_req: NextRequest) {
  const clientId = Math.random().toString(36).substring(7);
  
  console.log(`[SSE ${clientId}] New connection`);

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;
  
  const stream = new ReadableStream({
    async start(controller) {
      addClient(clientId, controller);
      
      console.log(`[SSE ${clientId}] Client registered for broadcasts`);
      
      // Send connection confirmation
      controller.enqueue(encoder.encode(': connected\n\n'));
      
      try {
        const queueStr = await redis.get('queue');
        const queue = queueStr || JSON.stringify({ queue: [] });
        controller.enqueue(encoder.encode(`data: ${queue}\n\n`));
      } catch (err) {
        console.error(`[SSE ${clientId}] Failed to get initial queue:`, err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ queue: [] })}\n\n`));
      }
      
      // Keep-alive ping every 30 seconds
      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (err) {
          clearInterval(intervalId);
          removeClient(clientId);
        }
      }, 30000);
    },
    
    cancel() {
      console.log(`[SSE ${clientId}] Connection closed`);
      clearInterval(intervalId);
      removeClient(clientId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
