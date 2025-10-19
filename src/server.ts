import express from 'express';
import next from 'next';
import { createServer } from 'http';
import Downloader from './lib/downloader';
import Tidal, { IncludeEnum } from './lib/tidal';
import { initializeWebSocket } from './lib/websocket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const serverApp = express();
  serverApp.use(express.json());

  serverApp.get('/api/albums', async (req, res) => {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).send("Parameter 'query' is required");
    }

    try {
      const result = await Tidal.Search(query, IncludeEnum.Albums);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  serverApp.post('/api/albums', async (req, res) => {
    try {
      const album = req.body;
      Downloader.AddToQueue(album);
      res.json({ status: 'OK' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add to queue' });
    }
  });

  serverApp.get('/api/queue', (_req, res) => {
    const queue = Downloader.GetQueue();
    res.json(queue);
  });

  serverApp.get(/(.*)/, (req, res) => handle(req, res));


  const server = createServer(serverApp);
  initializeWebSocket(server);

  server.listen(port, hostname, () => {
    console.info(`> running at http://${hostname}:${port}`);
  });
});

