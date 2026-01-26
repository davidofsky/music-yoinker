import logger from './logger'

export enum Topic {
  queue,
  log
}

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
      clientControllers: []
    };
  }
  return global.broadcastState
};

export function addClient(clientId: string, controller: ReadableStreamDefaultController, topic: Topic) {
  logger.debug(`[Broadcast] Adding client ${clientId}`);
  getState().clientControllers.push({ clientId, topic, controller });
}

export function removeClient(clientId: string) {
  logger.debug(`[Broadcast] Removing client ${clientId}`);
  const state = getState();
  state.clientControllers = state.clientControllers.filter(c => c.clientId !== clientId);
}

const encoder = new TextEncoder();
/*
 * Do NOT use the logger in the broadcast function,
 * because the logger uses this function itself which would create an infinite loop
 */
export async function broadcast(msg: string, topic: Topic) {
  const state = getState();
  const topicClients = state.clientControllers.filter(c => c.topic === topic);

  const message = encoder.encode(`data: ${msg}\n\n`);
  const deadClients: string[] = [];

  topicClients.forEach((listener) => {
    try {
      listener.controller.enqueue(message);
    } catch (err) {
      console.error(`[Broadcast] Failed to send to client ${listener.clientId}:`, err);
      deadClients.push(listener.clientId);
    }
  });

  deadClients.forEach(clientId => removeClient(clientId));
}