import redis from './redis';
import { Track } from './interfaces';

const clientControllers: Map<string, ReadableStreamDefaultController> = new Map();

export function addClient(clientId: string, controller: ReadableStreamDefaultController) {
  console.info(`[Broadcast] Adding client ${clientId}`);
  clientControllers.set(clientId, controller);
}

export function removeClient(clientId: string) {
  console.info(`[Broadcast] Removing client ${clientId}`);
  clientControllers.delete(clientId);
}

/*
 * Retrieve all clients from redis and enqueue the track array
 * If an error occurs, the client should be removed from the list
 */
export async function broadcastQueue(queue: Track[]) {
  const queueStr = JSON.stringify({ queue });
  
  console.info(`[Broadcast] Broadcasting to ${clientControllers.size} clients`);
  
  const encoder = new TextEncoder();
  const message = encoder.encode(`data: ${queueStr}\n\n`);
  const deadClients: string[] = [];
  
  clientControllers.forEach((controller, clientId) => {
    try {
      controller.enqueue(message);
      console.info(`[Broadcast] Sent to client ${clientId}`);
    } catch (err) {
      console.error(`[Broadcast] Failed to send to client ${clientId}:`, err);
      deadClients.push(clientId);
    }
  });
  
  deadClients.forEach(clientId => removeClient(clientId));
  try {
    await redis.set('queue', queueStr);
    console.info('[Broadcast] Saved queue to Redis');
  } catch (err) {
    console.error('[Broadcast] Failed to save to Redis:', err);
  }
}
