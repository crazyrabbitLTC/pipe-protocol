import { IpfsClient } from '../ipfsClient';
import { mockDataStore, mockPinnedCids } from './mocks/ipfs-http-client';
describe('IpfsClient', () => {
    let ipfsClient;
    beforeEach(async () => {
        mockDataStore.clear();
        mockPinnedCids.clear();
        ipfsClient = new IpfsClient({
            endpoint: 'http://localhost:5001'
        });
        await ipfsClient.init('http://localhost:5001', 'http://localhost:5001');
    });
    afterEach(async () => {
        await ipfsClient.stop();
    });
    describe('publish and fetch', () => {
        it('should successfully publish and fetch data', async () => {
            const record = {
                content: 'test data',
                type: 'data',
                scope: 'private',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            };
            const published = await ipfsClient.publish(record);
            expect(published.cid).toBeDefined();
            const fetched = await ipfsClient.fetch(published.cid, 'private');
            expect(fetched).toBeDefined();
            expect(fetched?.content).toBe('test data');
        });
        it('should handle JSON data', async () => {
            const data = { message: 'Hello, World!' };
            const record = {
                content: data,
                type: 'data',
                scope: 'private',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            };
            const published = await ipfsClient.publish(record);
            expect(published.cid).toBeDefined();
            const fetched = await ipfsClient.fetch(published.cid, 'private');
            expect(fetched).toBeDefined();
            expect(fetched?.content).toEqual(data);
        });
        it('should handle different scopes', async () => {
            const record = {
                content: 'test data',
                type: 'data',
                scope: 'public',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            };
            const published = await ipfsClient.publish(record);
            expect(published.cid).toBeDefined();
            const fetched = await ipfsClient.fetch(published.cid, 'public');
            expect(fetched).toBeDefined();
            expect(fetched?.content).toBe('test data');
        });
    });
    describe('pin management', () => {
        it('should pin and unpin content', async () => {
            const record = {
                content: 'test data',
                type: 'data',
                scope: 'private',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            };
            const published = await ipfsClient.publish(record);
            await ipfsClient.pin(published.cid, 'private');
            const pinnedCids = await ipfsClient.getPinnedCids('private');
            expect(pinnedCids).toContain(published.cid);
            await ipfsClient.unpin(published.cid, 'private');
            const updatedPinnedCids = await ipfsClient.getPinnedCids('private');
            expect(updatedPinnedCids).not.toContain(published.cid);
        });
    });
    describe('replication', () => {
        it('should replicate content between scopes', async () => {
            const record = {
                content: 'test data',
                type: 'data',
                scope: 'private',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            };
            const published = await ipfsClient.publish(record);
            await ipfsClient.replicate(published.cid, 'private', 'public');
            const fetched = await ipfsClient.fetch(published.cid, 'public');
            expect(fetched).toBeDefined();
            expect(fetched?.content).toBe('test data');
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
            expect(info.id).toBe('test-node');
        });
        it('should return storage metrics', async () => {
            const metrics = await ipfsClient.getStorageMetrics('private');
            expect(metrics).toBeDefined();
            expect(metrics.repoSize).toBe(1000);
            expect(metrics.storageMax).toBe(10000);
            expect(metrics.numObjects).toBe(0); // Should be 0 since we clear the store before each test
        });
        it('should return node configuration', async () => {
            const config = await ipfsClient.getConfiguration('private');
            expect(config).toBeDefined();
            expect(config.endpoint).toBe('http://localhost:5001');
        });
    });
    describe('error handling', () => {
        it('should handle non-existent CID', async () => {
            const result = await ipfsClient.fetch('QmNonExistent', 'private');
            expect(result).toBeNull();
        });
        it('should handle invalid scope', async () => {
            const record = {
                content: 'test data',
                type: 'data',
                scope: 'invalid',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            };
            await expect(ipfsClient.publish(record)).rejects.toThrow();
        });
        it('should handle stop and restart', async () => {
            await ipfsClient.stop();
            expect(ipfsClient.getStatus()).toBe(false);
            await ipfsClient.init('http://localhost:5001', 'http://localhost:5001');
            expect(ipfsClient.getStatus()).toBe(true);
        });
    });
});
