import { IpfsClient } from '../ipfsClient';
import { mockDataStore, mockPinnedCids } from './mocks/ipfs-http-client';

describe('IpfsClient', () => {
  let ipfsClient: IpfsClient;

  beforeEach(async () => {
    mockDataStore.clear();
    mockPinnedCids.clear();
    ipfsClient = new IpfsClient({
      endpoint: 'http://localhost:5001'
    });
    await ipfsClient.init();
  });

  afterEach(async () => {
    await ipfsClient.stop();
  });

  describe('Initialization', () => {
    it('should initialize correctly', async () => {
      const status = await ipfsClient.getStatus();
      expect(status.localNode).toBe(true);
    });

    it('should initialize with custom endpoint', async () => {
      const customClient = new IpfsClient({
        endpoint: 'http://localhost:5002'
      });
      await customClient.init();
      const status = await customClient.getStatus();
      expect(status.localNode).toBe(true);
      await customClient.stop();
    });
  });

  describe('Publishing and Fetching', () => {
    it('should publish and fetch a record successfully', async () => {
      const testRecord = {
        content: { test: 'data' },
        type: 'data' as const,
        scope: 'private' as const,
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      };

      const publishedRecord = await ipfsClient.publish(testRecord);
      expect(publishedRecord.cid).toBeDefined();
      
      if (!publishedRecord.cid) {
        throw new Error('Published record CID is undefined');
      }

      const fetchedContent = await ipfsClient.fetch(publishedRecord.cid, 'private');
      expect(fetchedContent).toEqual(testRecord.content);
    });

    it('should handle publishing without pinning', async () => {
      const testRecord = {
        content: { test: 'unpinned-data' },
        type: 'data' as const,
        scope: 'private' as const,
        pinned: false,
        accessPolicy: { hiddenFromLLM: false }
      };

      const publishedRecord = await ipfsClient.publish(testRecord);
      expect(publishedRecord.cid).toBeDefined();

      const pinnedCids = await ipfsClient.getPinnedCids('private');
      expect(pinnedCids).not.toContain(publishedRecord.cid);
    });

    it('should fail to fetch non-existent CID', async () => {
      const nonExistentCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      await expect(ipfsClient.fetch(nonExistentCid, 'private')).rejects.toThrow();
    });

    it('should fail to fetch with invalid CID', async () => {
      await expect(ipfsClient.fetch('invalid-cid', 'private')).rejects.toThrow();
    });
  });

  describe('Pinning Operations', () => {
    let testRecord: any;
    let publishedRecord: any;

    beforeEach(async () => {
      testRecord = {
        content: { test: 'pinning-test' },
        type: 'data' as const,
        scope: 'private' as const,
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      };
      publishedRecord = await ipfsClient.publish(testRecord);
      expect(publishedRecord.cid).toBeDefined();
    });

    it('should list pinned CIDs correctly', async () => {
      const pinnedCids = await ipfsClient.getPinnedCids('private');
      expect(Array.isArray(pinnedCids)).toBe(true);
      expect(pinnedCids).toHaveLength(1);
      expect(pinnedCids[0]).toBe(publishedRecord.cid);
    });

    it('should unpin CIDs correctly', async () => {
      if (!publishedRecord.cid) throw new Error('CID undefined');
      await ipfsClient.unpin(publishedRecord.cid, 'private');
      const pinnedCids = await ipfsClient.getPinnedCids('private');
      expect(pinnedCids).toHaveLength(0);
    });

    it('should handle unpinning non-existent CID gracefully', async () => {
      const nonExistentCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      await expect(ipfsClient.unpin(nonExistentCid, 'private')).resolves.not.toThrow();
    });
  });

  describe('Storage and Configuration', () => {
    it('should return storage metrics', async () => {
      const metrics = await ipfsClient.getStorageMetrics('private');
      expect(metrics).toHaveProperty('repoSize');
      expect(metrics).toHaveProperty('blockCount');
      expect(metrics).toHaveProperty('pinnedCount');
    });

    it('should return node configuration', async () => {
      const config = await ipfsClient.getConfiguration('private');
      expect(config).toHaveProperty('peerId');
      expect(config).toHaveProperty('addrs');
      expect(Array.isArray(config.addrs)).toBe(true);
    });

    it('should return node info', async () => {
      const info = await ipfsClient.getNodeInfo('private');
      expect(info).toHaveProperty('peerId');
    });
  });
}); 
