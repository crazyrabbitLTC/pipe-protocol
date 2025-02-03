import express from 'express';
import { PipeProtocol } from './pipe';
import { PipeRecord, PipeBundle, Scope } from './types';

export function createPipeAPI(pipe: PipeProtocol) {
  const app = express();
  app.use(express.json());

  app.post('/publish', async (req, res) => {
    try {
      const record: PipeRecord = req.body;
      const published = await pipe.publishRecord(record);
      res.json(published);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/publish-bundle', async (req, res) => {
    try {
      const bundle: PipeBundle = req.body;
      const published = await pipe.publishBundle(bundle);
      res.json(published);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/fetch', async (req, res) => {
    try {
      const { cid, scope } = req.query;
      if (!cid || !scope) {
        return res.status(400).json({ error: 'Missing cid or scope parameter' });
      }
      const record = await pipe.fetchRecord(cid as string, scope as Scope);
      res.json(record);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/pin', async (req, res) => {
    try {
      const { cid, scope } = req.body;
      if (!cid || !scope) {
        return res.status(400).json({ error: 'Missing cid or scope parameter' });
      }
      await pipe.pin(cid, scope as Scope);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/unpin', async (req, res) => {
    try {
      const { cid, scope } = req.body;
      if (!cid || !scope) {
        return res.status(400).json({ error: 'Missing cid or scope parameter' });
      }
      await pipe.unpin(cid, scope as Scope);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/replicate', async (req, res) => {
    try {
      const { cid, fromScope, toScope } = req.body;
      if (!cid || !fromScope || !toScope) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      await pipe.replicate(cid, fromScope as Scope, toScope as Scope);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/node-status', async (_req, res) => {
    try {
      const status = await pipe.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/node-info', async (req, res) => {
    try {
      const { scope } = req.query;
      if (!scope) {
        return res.status(400).json({ error: 'Missing scope parameter' });
      }
      const info = await pipe.getNodeInfo(scope as Scope);
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/storage-metrics', async (req, res) => {
    try {
      const { scope } = req.query;
      if (!scope) {
        return res.status(400).json({ error: 'Missing scope parameter' });
      }
      const metrics = await pipe.getStorageMetrics(scope as Scope);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/pinned-cids', async(req, res) => {
    try {
      const { scope } = req.query;
      if (!scope) {
        return res.status(400).json({ error: 'Missing scope parameter' });
      }
      const cids = await pipe.getPinnedCids(scope as Scope);
      res.json(cids);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/configuration', async (req, res) => {
    try {
      const { scope } = req.query;
      if (!scope) {
        return res.status(400).json({ error: 'Missing scope parameter' });
      }
      const config = await pipe.getConfiguration(scope as Scope);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return app;
} 