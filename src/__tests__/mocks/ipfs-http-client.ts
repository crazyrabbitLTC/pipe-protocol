// Create a shared data store for all tests
export const mockDataStore = new Map<string, any>();
export const mockPinnedCids = new Map<string, Set<string>>();

export const create = () => ({
  add: async (content: string) => {
    const cid = `mock-cid-${mockDataStore.size}`;
    mockDataStore.set(cid, content);
    return { cid: { toString: () => cid } };
  },

  cat: async function* (cid: string) {
    const content = mockDataStore.get(cid);
    if (!content) {
      throw new Error(`Content not found for CID: ${cid}`);
    }
    yield Buffer.from(content);
  },

  pin: {
    add: async (cid: string) => {
      const scope = 'private';
      if (!mockPinnedCids.has(scope)) {
        mockPinnedCids.set(scope, new Set());
      }
      mockPinnedCids.get(scope)?.add(cid);
    },
    rm: async (cid: string) => {
      const scope = 'private';
      mockPinnedCids.get(scope)?.delete(cid);
    },
    ls: async function* () {
      const scope = 'private';
      const pins = mockPinnedCids.get(scope) || new Set();
      for (const cid of pins) {
        yield { cid: { toString: () => cid } };
      }
    }
  },

  version: async () => ({ version: '0.0.1' }),

  stats: {
    repo: async () => ({
      repoSize: 0,
      numObjects: 0,
      storageMax: 0
    })
  }
});

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

export type { IPFSHTTPClient } from 'ipfs-http-client'; 
