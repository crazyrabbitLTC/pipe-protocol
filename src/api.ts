import express from 'express';
import { Pipe } from './pipe';
import { Scope } from './types';

export function createApi(pipe: Pipe) {
  const app = express();
  app.use(express.json());

  app.post('/store', async (req, res) => {
    try {
      const record = req.body;
      const published = await pipe.publishRecord(record);
      return res.json(published);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/store-bundle', async (req, res) => {
    try {
      const bundle = req.body;
      const published = await pipe.publishBundle(bundle);
      return res.json(published);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/fetch', async (req, res) => {
    try {
      const { cid, scope } = req.query;
      if (!cid) {
        return res.status(400).json({ error: 'Missing CID parameter' });
      }
      const record = await pipe.fetchRecord(cid as string, scope as Scope);
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/pin', async (req, res) => {
    try {
      const { cid, scope } = req.body;
      if (!cid) {
        return res.status(400).json({ error: 'Missing CID parameter' });
      }
      await pipe.pin(cid, scope as Scope);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/unpin', async (req, res) => {
    try {
      const { cid, scope } = req.body;
      if (!cid) {
        return res.status(400).json({ error: 'Missing CID parameter' });
      }
      await pipe.unpin(cid, scope as Scope);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/replicate', async (req, res) => {
    try {
      const { cid, fromScope, toScope } = req.body;
      if (!cid || !fromScope || !toScope) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      await pipe.replicate(cid, fromScope as Scope, toScope as Scope);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/node-info', async (req, res) => {
    try {
      const { scope } = req.query;
      const info = await pipe.getNodeInfo(scope as Scope);
      return res.json(info);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/storage-metrics', async (req, res) => {
    try {
      const { scope } = req.query;
      const metrics = await pipe.getStorageMetrics(scope as Scope);
      return res.json(metrics);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/pinned-cids', async(req, res) => {
    try {
      const { scope } = req.query;
      const cids = await pipe.getPinnedCids(scope as Scope);
      return res.json(cids);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/configuration', async (req, res) => {
    try {
      const { scope } = req.query;
      const config = await pipe.getConfiguration(scope as Scope);
      return res.json(config);
    } catch (error) {
      return res.status(500).json({ error: (error as Error).message });
    }
  });

  return app;
} 