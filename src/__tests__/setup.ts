// Increase timeout for IPFS operations
jest.setTimeout(10000);

// Mock crypto for consistent test results
const mockRandomValues = new Uint8Array([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
]);

const originalCrypto = global.crypto;
global.crypto = {
  ...originalCrypto,
  getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
    if (array instanceof Uint8Array) {
      array.set(mockRandomValues.subarray(0, array.length));
    }
    return array;
  }
};

// Clean up function to restore original crypto
afterAll(() => {
  global.crypto = originalCrypto;
}); 
