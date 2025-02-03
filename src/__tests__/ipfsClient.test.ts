import { IpfsClient } from '../ipfsClient';
import { PipeRecord } from '../types';

describe('IpfsClient', () => {
  let ipfsClient: IpfsClient;

  beforeEach(() => {
    ipfsClient = new IpfsClient();
  });

  afterEach(async () => {
    await ipfsClient.stop();
  });

  describe('publish and fetch', () => {
    it('should successfully publish and fetch data', async () => {
      const record: PipeRecord = {
        content: 'Hello, World!',
        type: 'data',
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };

      const published = await ipfsClient.publish(record);
      expect(published.cid).toBeDefined();

      const fetched = await ipfsClient.fetch(published.cid!, 'private');
      expect(fetched).toBeDefined();
      expect(fetched?.content).toBe(record.content);
    });

    it('should handle JSON data', async () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      const record: PipeRecord = {
        content: data,
        type: 'data',
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };

      const published = await ipfsClient.publish(record);
      expect(published.cid).toBeDefined();

      const fetched = await ipfsClient.fetch(published.cid!, 'private');
      expect(fetched).toBeDefined();
      expect(fetched?.content).toEqual(data);
    });

    it('should handle different scopes', async () => {
      const record: PipeRecord = {
        content: 'Public Data',
        type: 'data',
        scope: 'public',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };

      const published = await ipfsClient.publish(record);
      expect(published.cid).toBeDefined();

      const fetched = await ipfsClient.fetch(published.cid!, 'public');
      expect(fetched).toBeDefined();
      expect(fetched?.content).toBe(record.content);
    });
  });

  describe('pin management', () => {
    it('should pin and unpin content', async () => {
      const record: PipeRecord = {
        content: 'Pinned Data',
        type: 'data',
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };

      const published = await ipfsClient.publish(record);
      await ipfsClient.pin(published.cid!, 'private');

      const pinnedCids = await ipfsClient.getPinnedCids('private');
      expect(pinnedCids).toContain(published.cid);

      await ipfsClient.unpin(published.cid!, 'private');
      const updatedPinnedCids = await ipfsClient.getPinnedCids('private');
      expect(updatedPinnedCids).not.toContain(published.cid);
    });
  });

  describe('replication', () => {
    it('should replicate content between scopes', async () => {
      const record: PipeRecord = {
        content: 'Replicated Data',
        type: 'data',
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };

      const published = await ipfsClient.publish(record);
      await ipfsClient.replicate(published.cid!, 'private', 'public');

      const fetched = await ipfsClient.fetch(published.cid!, 'public');
      expect(fetched).toBeDefined();
      expect(fetched?.content).toBe(record.content);
    });
  });

  describe('node management', () => {
    it('should return node status', () => {
      const status = ipfsClient.getStatus();
      expect(status).toBe(true);
    });

    it('should return node info', async () => {
      const info = await ipfsClient.getNodeInfo('private');
      expect(info).toBeDefined();
    });

    it('should return storage metrics', async () => {
      const metrics = await ipfsClient.getStorageMetrics('private');
      expect(metrics).toBeDefined();
      expect(metrics.repoSize).toBeDefined();
      expect(metrics.storageMax).toBeDefined();
      expect(metrics.numObjects).toBeDefined();
    });

    it('should return node configuration', () => {
      const config = ipfsClient.getConfiguration('private');
      expect(config).toBeDefined();
      expect(config.scope).toBe('private');
    });
  });

  describe('error handling', () => {
    it('should handle non-existent CID', async () => {
      const nonExistentCid = 'QmNonExistent';
      const fetched = await ipfsClient.fetch(nonExistentCid, 'private');
      expect(fetched).toBeNull();
    });

    it('should handle invalid scope', async () => {
      const record: PipeRecord = {
        content: 'Test Data',
        type: 'data',
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };

      const published = await ipfsClient.publish(record);
      // @ts-ignore - Testing invalid scope
      await expect(ipfsClient.fetch(published.cid!, 'invalid')).rejects.toThrow();
    });

    it('should handle stop and restart', async () => {
      await ipfsClient.stop();
      expect(ipfsClient.getStatus()).toBe(false);

      ipfsClient = new IpfsClient();
      expect(ipfsClient.getStatus()).toBe(true);
    });
  });
}); 
