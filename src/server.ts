import express from 'express';
import next from 'next';
import { createServer } from 'http';
import Downloader from './lib/downloader';
import Hifi from './lib/hifi';
import { initializeWebSocket } from './lib/websocket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.BACKEND_PORT || '3000', 10);

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
      const result = await Hifi.searchAlbum(query);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  serverApp.get('/api/tracks', async (req, res) => {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).send("Parameter 'query' is required");
    }

    try {
      const result = await Hifi.searchTrack(query);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  serverApp.get('/api/artists', async (req, res) => {
    const query = req.query.query as string;
    if (!query) {
      return res.status(400).send("Parameter 'query' is required");
    }

    try {
      const result = await Hifi.searchArtist(query);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  serverApp.get('/api/album', async (req, res) => {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).send("Parameter 'id' is required");
    }

    try {
      const result = await Hifi.searchAlbumTracks(id);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Retrieve failed' });
    }
  });

  serverApp.get('/api/artist', async (req, res) => {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).send("Parameter 'id' is required");
    }

    try {
      const result = await Hifi.searchArtistAlbums(id);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Retrieve failed' });
    }
  });

  serverApp.post('/api/tracks', async (req, res) => {
    try {
      const tracks = req.body;
      Downloader.AddToQueue(tracks);
      res.json({ status: 'OK' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add to queue' });
    }
  });

  serverApp.delete('/api/track', async (req, res) => {
    try {
      const id = req.query.id as string;
      if (!id) {
        return res.status(400).send("Parameter 'id' is required");
      }
      const errorMessage = Downloader.RemoveFromQueue(id);
      if (errorMessage) {
        res.statusCode = 400 ;
        res.json( { status: 'Bad request', message: errorMessage})
      } else {
        res.json({ status: 'OK' });
      }
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

