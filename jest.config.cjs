/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json'
      }
    ]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^helia$': '<rootDir>/node_modules/helia/dist/src/index.js',
    '^multiformats/(.*)$': '<rootDir>/node_modules/multiformats/dist/src/$1.js'
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  transformIgnorePatterns: [
    'node_modules/(?!(helia|@helia|multiformats|blockstore-core|uint8arrays|@multiformats|@ipld|ipfs-unixfs-importer|ipfs-unixfs|@ipfs|ipfs-core-types|ipfs-core-utils|ipfs-utils|ipfs-bitswap|ipfs-block|ipfs-block-service|ipfs-repo|ipfs-unixfs-exporter|ipfs-unixfs-importer|ipfs-unixfs-importer|ipfs-unixfs-importer|ipfs-unixfs-importer|ipfs-unixfs-importer)/)'
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
  testRunner: 'jest-circus/runner',
  setupFiles: ['<rootDir>/jest.setup.cjs']
}; 