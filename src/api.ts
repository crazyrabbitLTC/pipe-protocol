import express from 'express';
import { PipeProtocol } from './pipe';
import { PipeRecord, PipeBundle, Scope } from './types';

export function createApi(pipeProtocol: PipeProtocol) {
  const app = express();
  app.use(express.json());

  app.post('/publish', async (req, res) => {
    try {
      const record = await pipeProtocol.publishRecord(req.body as PipeRecord);
      res.json(record);
    } catch (error) {
      console.error("Error publishing record:", error);
      res.status(500).send("Failed to publish record.");
    }
  });

  app.post('/publish-bundle', async (req, res) => {
    try {
      const bundle = await pipeProtocol.publishBundle(req.body as PipeBundle);
      res.json(bundle);
    } catch(error) {
      console.error("Error publishing bundle:", error);
      res.status(500).send("Failed to publish bundle.");
    }
  });

  app.get('/fetch', async (req, res) => {
    try {
      const { cid, scope } = req.query;
      const data = await pipeProtocol.fetchRecord(cid as string, scope as Scope);
      res.json(data);
    } catch(error) {
      console.error("Error fetching record:", error);
      res.status(500).send("Failed to fetch record.");
    }
  });

  app.post('/pin', async (req, res) => {
    try {
      const { cid, scope } = req.body;
      await pipeProtocol.pin(cid as string, scope as Scope);
      res.status(200).send('Pinned successfully');
    } catch (error) {
      console.error("Error pinning record:", error);
      res.status(500).send("Failed to pin record.");
    }
  });

  app.post('/unpin', async (req, res) => {
    try {
      const { cid, scope } = req.body;
      await pipeProtocol.unpin(cid as string, scope as Scope);
      res.status(200).send('Unpinned successfully');
    } catch(error) {
      console.error("Error unpinning record:", error);
      res.status(500).send("Failed to unpin record.");
    }
  });

  app.post('/replicate', async (req, res) => {
    try {
      const { cid, fromScope, toScope } = req.body;
      await pipeProtocol.replicate(cid as string, fromScope as Scope, toScope as Scope);
      res.status(200).send("Replicated successfully");
    } catch(error) {
      console.error("Error replicating record:", error);
      res.status(500).send("Failed to replicate record.");
    }
  });

  app.get('/node-status', async (req, res) => {
    try {
      const status = await pipeProtocol.getStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting node status:', error);
      res.status(500).send("Failed to fetch node status.");
    }
  });

  app.get('/node-info', async (req, res) => {
    try {
      const { scope } = req.query;
      const info = await pipeProtocol.getNodeInfo(scope as Scope);
      res.json(info);
    } catch(error) {
      console.error('Error getting node info:', error);
      res.status(500).send("Failed to fetch node info.");
    }
  });

  app.get('/storage-metrics', async (req, res) => {
    try {
      const { scope } = req.query;
      const metrics = await pipeProtocol.getStorageMetrics(scope as Scope);
      res.json(metrics);
    } catch(error) {
      console.error('Error getting storage metrics:', error);
      res.status(500).send("Failed to fetch storage metrics");
    }
  });

  app.get('/pinned-cids', async(req, res) => {
    try {
      const { scope } = req.query;
      const pins = await pipeProtocol.getPinnedCids(scope as Scope);
      res.json(pins);
    } catch(error) {
      console.error('Error getting pinned CIDs:', error);
      res.status(500).send('Failed to fetch pinned cids');
    }
  });

  app.get('/configuration', async (req, res) => {
    try {
      const { scope } = req.query;
      const config = await pipeProtocol.getConfiguration(scope as Scope);
      res.json(config);
    } catch(error) {
      console.error('Error getting configuration:', error);
      res.status(500).send('Failed to fetch configuration');
    }
  });

  return app;
} 