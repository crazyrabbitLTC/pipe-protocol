// Create a shared data store for all tests
export const mockDataStore = new Map<string, any>();
export const mockPinnedCids = new Set<string>();

const mockIPFSClient = {
  add: jest.fn().mockImplementation(async (data: any) => {
    const cid = `QmTest${Math.random().toString(36).substring(7)}`;
    // Store the data as a string, just like the real IPFS client
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    mockDataStore.set(cid, stringData);
    return { path: cid };
  }),

  cat: jest.fn().mockImplementation(function* (cid: string) {
    const data = mockDataStore.get(cid);
    if (!data) {
      throw new Error('CID not found');
    }
    // Return the data as a Buffer, just like the real IPFS client
    yield Buffer.from(data);
  }),

  pin: {
    add: jest.fn().mockImplementation(async (cid: string) => {
      mockPinnedCids.add(cid);
      return undefined;
    }),
    rm: jest.fn().mockImplementation(async (cid: string) => {
      mockPinnedCids.delete(cid);
      return undefined;
    }),
    ls: jest.fn().mockImplementation(function* () {
      for (const cid of mockPinnedCids) {
        yield { cid: { toString: () => cid } };
      }
    })
  },

  id: jest.fn().mockResolvedValue({ id: 'test-node' }),

  stats: {
    repo: jest.fn().mockResolvedValue({
      repoSize: 1000,
      storageMax: 10000,
      numObjects: mockDataStore.size
    })
  },

  stop: jest.fn().mockResolvedValue(undefined),
  getEndpointConfig: jest.fn().mockReturnValue('http://localhost:5001')
};

// Create a store for record metadata
export const mockRecordStore = new Map<string, any>();

// Override the add method to store both content and record metadata
mockIPFSClient.add = jest.fn().mockImplementation(async (data: any) => {
  const cid = `QmTest${Math.random().toString(36).substring(7)}`;
  // Store the data as a string, just like the real IPFS client
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  mockDataStore.set(cid, stringData);
  return { path: cid };
});

export const create = jest.fn(() => mockIPFSClient);
export type { IPFSHTTPClient } from 'ipfs-http-client'; 
