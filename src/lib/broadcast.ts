import { ITrack } from '@/app/interfaces/track.interface';

type ClientControllerList = Array<{
  topic: Topic,
  clientId: string,
  controller: ReadableStreamDefaultController
}>

declare global {
  var broadcastState: {
    clientControllers: ClientControllerList;
  }
}

const getState = () => {
  if (!global.broadcastState) {
    global.broadcastState = {
      clientControllers: new Array()
    };
  }
  return global.broadcastState
};

export function addClient(clientId: string, controller: ReadableStreamDefaultController, topic: Topic) {
  logger.info(`[Broadcast] Adding client ${clientId}`);
  getState().clientControllers.push({ clientId, topic, controller });
}

export function removeClient(clientId: string) {
  logger.info(`[Broadcast] Removing client ${clientId}`);
  const state = getState();
  state.clientControllers = state.clientControllers.filter(c => c.clientId !== clientId);
}

export async function broadcastQueue(queue: ITrack[]) {
  const state = getState();
  console.info(`[Broadcast] Broadcasting to ${state.clientControllers.size} clients`);

  const encoder = new TextEncoder();
  const message = encoder.encode(`data: ${JSON.stringify(queue)}\n\n`);
  const deadClients: string[] = [];

  state.clientControllers.forEach((controller, clientId) => {
    try {
      listener.controller.enqueue(message);
      console.info(`[Broadcast] Sent to client ${listener.clientId}`);
    } catch (err) {
      console.error(`[Broadcast] Failed to send to client ${listener.clientId}:`, err);
      deadClients.push(listener.clientId);
    }
  });

  deadClients.forEach(clientId => removeClient(clientId));
}
