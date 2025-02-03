const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('helia', () => ({
  createHelia: jest.fn().mockResolvedValue({
    blockstore: {
      put: jest.fn(),
      get: jest.fn()
    },
    stop: jest.fn()
  }),
  Helia: jest.fn()
}));

jest.mock('multiformats/cid', () => ({
  CID: {
    parse: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('multiformats/codecs/raw', () => ({
  code: 0x55,
  encode: jest.fn(),
  decode: jest.fn()
}));

jest.mock('multiformats/hashes/sha2', () => ({
  sha256: {
    code: 0x12,
    digest: jest.fn()
  }
}));

jest.mock('blockstore-core', () => ({
  MemoryBlockstore: jest.fn().mockImplementation(() => ({
    put: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    delete: jest.fn()
  }))
})); 
