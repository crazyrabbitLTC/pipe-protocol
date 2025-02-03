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
}); 
