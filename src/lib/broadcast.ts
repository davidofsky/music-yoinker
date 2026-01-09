import { ITrack } from '@/app/interfaces/track.interface';

type ClientControllerList = Map<string, ReadableStreamDefaultController>

declare global {
  var broadcastState: {
    clientControllers: ClientControllerList;
  }
}

const getState = () => {
  if (!global.broadcastState) {
    global.broadcastState = {
      clientControllers: new Map()
    };
  }
  return global.broadcastState
};

export function addClient(clientId: string, controller: ReadableStreamDefaultController) {
  console.info(`[Broadcast] Adding client ${clientId}`);
  getState().clientControllers.set(clientId, controller);
}

export function removeClient(clientId: string) {
  console.info(`[Broadcast] Removing client ${clientId}`);
  getState().clientControllers.delete(clientId);
}

export async function broadcastQueue(queue: ITrack[]) {
  const state = getState();
  console.info(`[Broadcast] Broadcasting to ${state.clientControllers.size} clients`);

  const encoder = new TextEncoder();
  const message = encoder.encode(`data: ${JSON.stringify(queue)}\n\n`);
  const deadClients: string[] = [];

  state.clientControllers.forEach((controller, clientId) => {
    try {
      controller.enqueue(message);
      console.info(`[Broadcast] Sent to client ${clientId}`);
    } catch (err) {
      console.error(`[Broadcast] Failed to send to client ${clientId}:`, err);
      deadClients.push(clientId);
    }
  });
  deadClients.forEach(clientId => removeClient(clientId));
}
