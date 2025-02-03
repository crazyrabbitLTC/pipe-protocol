import { IpfsClient } from '../ipfsClient.js';
import { PipeRecord } from '../types.js';

describe('IpfsClient', () => {
  let client: IpfsClient;

  beforeEach(async () => {
    client = new IpfsClient();
  });

  afterEach(async () => {
    await client.stop();
  });

  describe('Initialization', () => {
    it('should initialize all nodes correctly', async () => {
      const status = await client.getStatus();
      expect(status.localNode).toBe(true);
      expect(status.machineNode).toBe(true);
      expect(status.userNode).toBe(true);
      expect(status.publicNode).toBe(true);
    });

    it('should initialize with custom endpoints', async () => {
      const customClient = new IpfsClient({
        localNodeEndpoint: 'http://localhost:5001',
        publicNodeEndpoint: 'https://ipfs.example.com'
      });
      const status = await customClient.getStatus();
      expect(status.localNode).toBe(true);
      expect(status.publicNode).toBe(true);
      await customClient.stop();
    });
  });

  describe('Publishing and Fetching', () => {
    it('should publish and fetch a record successfully', async () => {
      const testRecord: PipeRecord = {
        type: 'data',
        content: { test: 'data' },
        scope: 'private',
        pinned: true,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      const publishedRecord = await client.publish(testRecord);
      expect(publishedRecord.cid).toBeDefined();
      
      if (!publishedRecord.cid) {
        throw new Error('Published record CID is undefined');
      }

      const fetchedContent = await client.fetch(publishedRecord.cid, 'private');
      expect(fetchedContent).toEqual(testRecord.content);
    });

    it('should handle publishing without pinning', async () => {
      const testRecord: PipeRecord = {
        type: 'data',
        content: { test: 'unpinned-data' },
        scope: 'private',
        pinned: false
      };

      const publishedRecord = await client.publish(testRecord);
      expect(publishedRecord.cid).toBeDefined();

      const pinnedCids = await client.getPinnedCids('private');
      expect(pinnedCids).not.toContain(publishedRecord.cid);
    });

    it('should fail to fetch non-existent CID', async () => {
      const nonExistentCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      await expect(client.fetch(nonExistentCid, 'private')).rejects.toThrow();
    });

    it('should fail to fetch with invalid CID', async () => {
      await expect(client.fetch('invalid-cid', 'private')).rejects.toThrow();
    });
  });

  describe('Pinning Operations', () => {
    let testRecord: PipeRecord;
    let publishedRecord: PipeRecord;

    beforeEach(async () => {
      testRecord = {
        type: 'data',
        content: { test: 'pinning-test' },
        scope: 'private',
        pinned: true
      };
      publishedRecord = await client.publish(testRecord);
      expect(publishedRecord.cid).toBeDefined();
    });

    it('should list pinned CIDs correctly', async () => {
      const pinnedCids = await client.getPinnedCids('private');
      expect(Array.isArray(pinnedCids)).toBe(true);
      expect(pinnedCids).toHaveLength(1);
      expect(pinnedCids[0]).toBe(publishedRecord.cid);
    });

    it('should unpin CIDs correctly', async () => {
      if (!publishedRecord.cid) throw new Error('CID undefined');
      
      await client.unpin(publishedRecord.cid, 'private');
      const pinnedCids = await client.getPinnedCids('private');
      expect(pinnedCids).toHaveLength(0);
    });

    it('should handle unpinning non-existent CID gracefully', async () => {
      const nonExistentCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      await expect(client.unpin(nonExistentCid, 'private')).resolves.not.toThrow();
    });

    it('should maintain separate pin sets for different scopes', async () => {
      const privateRecord = await client.publish({
        type: 'data',
        content: { scope: 'private-data' },
        scope: 'private',
        pinned: true
      });

      const publicRecord = await client.publish({
        type: 'data',
        content: { scope: 'public-data' },
        scope: 'public',
        pinned: true
      });

      const privatePins = await client.getPinnedCids('private');
      const publicPins = await client.getPinnedCids('public');

      expect(privatePins).toContain(privateRecord.cid);
      expect(publicPins).toContain(publicRecord.cid);
      expect(privatePins).not.toContain(publicRecord.cid);
      expect(publicPins).not.toContain(privateRecord.cid);
    });
  });

  describe('Replication', () => {
    it('should replicate content between scopes', async () => {
      const testRecord: PipeRecord = {
        type: 'data',
        content: { test: 'replication-test' },
        scope: 'private',
        pinned: true
      };

      const publishedRecord = await client.publish(testRecord);
      expect(publishedRecord.cid).toBeDefined();
      if (!publishedRecord.cid) throw new Error('CID undefined');

      await client.replicate(publishedRecord.cid, 'private', 'public');

      const privatePins = await client.getPinnedCids('private');
      const publicPins = await client.getPinnedCids('public');

      expect(privatePins).toContain(publishedRecord.cid);
      expect(publicPins).toContain(publishedRecord.cid);

      const publicContent = await client.fetch(publishedRecord.cid, 'public');
      expect(publicContent).toEqual(testRecord.content);
    });

    it('should fail to replicate non-existent content', async () => {
      // Use a CID that we know doesn't exist
      const nonExistentCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      await expect(client.replicate(nonExistentCid, 'public', 'private'))
        .rejects
        .toThrow('Content not found in source scope');
    });

    it('should fail to replicate with invalid source scope', async () => {
      const testRecord: PipeRecord = {
        type: 'data',
        content: { test: 'scope-test' },
        scope: 'private',
        pinned: true
      };

      const publishedRecord = await client.publish(testRecord);
      if (!publishedRecord.cid) throw new Error('CID undefined');

      await expect(
        client.replicate(publishedRecord.cid, 'invalid-scope' as any, 'public')
      ).rejects.toThrow();
    });
  });

  describe('Storage and Configuration', () => {
    it('should return storage metrics', async () => {
      const metrics = await client.getStorageMetrics('private');
      expect(metrics).toHaveProperty('repoSize');
      expect(metrics).toHaveProperty('blockCount');
      expect(metrics).toHaveProperty('pinnedCount');
      expect(typeof metrics.pinnedCount).toBe('number');
    });

    it('should return node configuration', async () => {
      const config = await client.getConfiguration('private');
      expect(config).toHaveProperty('peerId');
      expect(config).toHaveProperty('addrs');
      expect(Array.isArray(config.addrs)).toBe(true);
    });

    it('should return node info', async () => {
      const info = await client.getNodeInfo('private');
      expect(info).toHaveProperty('peerId');
    });
  });
}); 
