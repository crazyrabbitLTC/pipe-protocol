"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.mockRecordStore = exports.mockPinnedCids = exports.mockDataStore = void 0;
// Create a shared data store for all tests
exports.mockDataStore = new Map();
exports.mockPinnedCids = new Set();
const mockIPFSClient = {
    add: jest.fn().mockImplementation(async (data) => {
        const cid = `QmTest${Math.random().toString(36).substring(7)}`;
        // Store the data as a string, just like the real IPFS client
        const stringData = typeof data === 'string' ? data : JSON.stringify(data);
        exports.mockDataStore.set(cid, stringData);
        return { path: cid };
    }),
    cat: jest.fn().mockImplementation(function* (cid) {
        const data = exports.mockDataStore.get(cid);
        if (!data) {
            throw new Error('CID not found');
        }
        // Return the data as a Buffer, just like the real IPFS client
        yield Buffer.from(data);
    }),
    pin: {
        add: jest.fn().mockImplementation(async (cid) => {
            exports.mockPinnedCids.add(cid);
            return undefined;
        }),
        rm: jest.fn().mockImplementation(async (cid) => {
            exports.mockPinnedCids.delete(cid);
            return undefined;
        }),
        ls: jest.fn().mockImplementation(function* () {
            for (const cid of exports.mockPinnedCids) {
                yield { cid: { toString: () => cid } };
            }
        })
    },
    id: jest.fn().mockResolvedValue({ id: 'test-node' }),
    stats: {
        repo: jest.fn().mockResolvedValue({
            repoSize: 1000,
            storageMax: 10000,
            numObjects: exports.mockDataStore.size
        })
    },
    stop: jest.fn().mockResolvedValue(undefined),
    getEndpointConfig: jest.fn().mockReturnValue('http://localhost:5001')
};
// Create a store for record metadata
exports.mockRecordStore = new Map();
// Override the add method to store both content and record metadata
mockIPFSClient.add = jest.fn().mockImplementation(async (data) => {
    const cid = `QmTest${Math.random().toString(36).substring(7)}`;
    // Store the data as a string, just like the real IPFS client
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    exports.mockDataStore.set(cid, stringData);
    return { path: cid };
});
exports.create = jest.fn(() => mockIPFSClient);
//# sourceMappingURL=ipfs-http-client.js.map