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


const encoder = new TextEncoder();
/*
 * Do NOT use the logger in the broadcast function,
 * because the logger uses this function itself which would create an infinite loop
 */
export async function broadcast(msg: string, topic: Topic) {
  const state = getState();
  const topicClients = state.clientControllers.filter(c => c.topic === topic);

  console.info(`[Broadcast] Broadcasting to ${topicClients.length} clients on topic ${Topic[topic]}`);

  const message = encoder.encode(`data: ${msg}\n\n`);
  const deadClients: string[] = [];

  topicClients.forEach((listener) => {
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