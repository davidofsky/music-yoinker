import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer, WebSocket } from 'ws';

declare global {
  var wsServer: WebSocketServer | undefined;
}

export type Message = {
  type: "queue"
  message: string
}



class WsClient extends WebSocket {
  public id: string = ""
}

export function initializeWebSocket(server: Server) {
  if (global.wsServer) {
    console.info('[WebSocket] Already initialized');
    return;
  }

  console.info('[WebSocket] Initializing...');
  
  global.wsServer = new WebSocketServer({ 
    server, 
    path: '/api/ws' 
  });

  global.wsServer.on('connection', (ws: WebSocket) => {
    const clientId = uuidv4();
    (ws as WsClient).id = clientId;
    
    console.info(`[WebSocket] Client connected: ${clientId}`);
    console.info(`[WebSocket] Total clients: ${global.wsServer?.clients.size}`);

    ws.on('message', (message) => {
      console.info('[WebSocket] Received:', message.toString());
    });

    ws.on('close', () => {
      console.info(`[WebSocket] Client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });
  });

  console.info('[WebSocket] Initialized successfully');
}

export function broadcast(message: Message) {
  if (!global.wsServer) {
    console.error('[WebSocket] Not initialized. Cannot broadcast.');
    return;
  }

  const clientCount = global.wsServer.clients.size;
  console.info(`[WebSocket] Broadcasting to ${clientCount} clients`);

  if (clientCount === 0) {
    console.warn('[WebSocket] No clients connected');
    return;
  }

  const data = JSON.stringify(message);
  let sentCount = 0;

  global.wsServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
        sentCount++;
      } catch (error) {
        console.error('[WebSocket] Send error:', error);
      }
    }
  });

  console.info(`[WebSocket] Sent to ${sentCount}/${clientCount} clients`);
}

export function sendToClient(clientId: string, message: Message) {
  if (!global.wsServer) {
    console.error('[WebSocket] Not initialized');
    return;
  }

  const data = JSON.stringify(message);
  global.wsServer.clients.forEach((client) => {
    if ((client as WsClient).id === clientId && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export function getConnectedClients(): number {
  return global.wsServer?.clients.size || 0;
}

export function isInitialized(): boolean {
  return global.wsServer !== undefined;
}
