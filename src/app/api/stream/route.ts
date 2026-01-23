import { NextRequest } from 'next/server';
import { addClient, removeClient, Topic } from '@/lib/broadcast';
import logger from '@lib/logger';
import Downloader from '@/lib/downloader';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const topicParam = searchParams.get('topic')?.toLowerCase();

  const topicMap: Record<string, Topic> = {
    'queue': Topic.queue,
    'log': Topic.log
  };

  if (!topicParam || !(topicParam in topicMap)) {
    return new Response(
      JSON.stringify({
        error: 'Invalid or missing topic param',
        validTopics: Object.keys(topicMap)
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const topic = topicMap[topicParam];  const clientId = Math.random().toString(36).substring(7);

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      addClient(clientId, controller, topic);

      // Send connection confirmation
      controller.enqueue(encoder.encode(': connected\n\n'));

      try {
        const queue = Downloader.GetQueue();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(queue)}\n\n`));
      } catch (err) {
        logger.error(`[SSE ${clientId}] Failed to get initial queue:`, err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify([])}\n\n`));
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