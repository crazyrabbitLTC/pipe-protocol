/**
 * @file IpfsNode Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * This file contains tests for the unified IpfsNode implementation.
 * 
 * Test Coverage:
 * - Node initialization with different storage types
 * - Data addition and retrieval
 * - Error handling
 * - Multiple operation handling
 * - Data persistence (for persistent storage)
 * - Network exposure control
 * - Data export/import functionality
 * - Storage isolation
 * 
 * IMPORTANT:
 * - All new features must have corresponding tests
 * - Run full test suite before committing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IpfsNode } from '../ipfsNode';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

describe('IpfsNode', () => {
  describe('Memory Storage', () => {
    let node: IpfsNode;

    beforeEach(async () => {
      node = new IpfsNode({ storage: 'memory' });
      await node.init();
    });

    afterEach(async () => {
      await node.stop();
    });

    it('should initialize successfully with memory storage', () => {
      expect(node).toBeInstanceOf(IpfsNode);
    });

    it('should add and retrieve data correctly in memory', async () => {
      const testData = new TextEncoder().encode('Hello, IPFS!');
      const cid = await node.add(testData);
      
      expect(cid).toBeDefined();
      expect(typeof cid).toBe('string');
      
      const retrievedData = await node.get(cid);
      const decodedData = new TextDecoder().decode(retrievedData);
      
      expect(decodedData).toBe('Hello, IPFS!');
    });

    it('should not persist data between memory node restarts', async () => {
      // Add data to the first instance
      const testData = new TextEncoder().encode('Memory test data');
      const cid = await node.add(testData);
      
      // Stop the first instance
      await node.stop();
      
      // Create a new instance
      const newNode = new IpfsNode({ storage: 'memory' });
      await newNode.init();
      
      try {
        // Try to retrieve the data from the new instance (should fail)
        await expect(newNode.get(cid)).rejects.toThrow('CID not found');
      } finally {
        await newNode.stop();
      }
    });
  });

  describe('Persistent Storage', () => {
    let node: IpfsNode;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'));
      node = new IpfsNode({ 
        storage: 'persistent',
        storageConfig: { directory: tempDir }
      });
      await node.init();
    });

    afterEach(async () => {
      await node.stop();
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should initialize successfully with persistent storage', () => {
      expect(node).toBeInstanceOf(IpfsNode);
    });

    it('should require storage directory for persistent storage', async () => {
      await expect(() => 
        new IpfsNode({ storage: 'persistent' })
      ).toThrow('Storage directory is required for persistent storage');
    });

    it('should persist data between node restarts', async () => {
      // Add data to the first instance
      const testData = new TextEncoder().encode('Persistent test data');
      const cid = await node.add(testData);
      
      // Stop the first instance
      await node.stop();
      
      // Create a new instance with the same storage directory
      const newNode = new IpfsNode({ 
        storage: 'persistent',
        storageConfig: { directory: tempDir }
      });
      await newNode.init();
      
      try {
        // Try to retrieve the data from the new instance
        const retrievedData = await newNode.get(cid);
        const decodedData = new TextDecoder().decode(retrievedData);
        expect(decodedData).toBe('Persistent test data');
      } finally {
        await newNode.stop();
      }
    });
  });

  describe('Network Exposure', () => {
    it('should operate in offline mode by default for both storage types', async () => {
      // Suppress expected CID not found errors
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        const errorMessage = args.join(' ');
        if (!errorMessage.includes('Failed to get data: Error: CID not found')) {
          originalConsoleError(...args);
        }
      };

      const tempDir1 = await mkdtemp(join(tmpdir(), 'ipfs-test-1-'));
      const tempDir2 = await mkdtemp(join(tmpdir(), 'ipfs-test-2-'));

      // Test with memory storage
      const memNode1 = new IpfsNode({ storage: 'memory' });
      const memNode2 = new IpfsNode({ storage: 'memory' });

      // Test with persistent storage
      const persistentNode1 = new IpfsNode({ 
        storage: 'persistent',
        storageConfig: { directory: tempDir1 }
      });
      const persistentNode2 = new IpfsNode({ 
        storage: 'persistent',
        storageConfig: { directory: tempDir2 }
      });

      try {
        await memNode1.init();
        await memNode2.init();
        await persistentNode1.init();
        await persistentNode2.init();

        // Test memory nodes
        const memCid = await memNode1.add(new TextEncoder().encode('memory test'));
        await expect(memNode2.get(memCid)).rejects.toThrow('CID not found');
        expect(await memNode1.getMultiaddrs()).toHaveLength(0);
        expect(await memNode2.getMultiaddrs()).toHaveLength(0);

        // Test persistent nodes
        const persistentCid = await persistentNode1.add(new TextEncoder().encode('persistent test'));
        await expect(persistentNode2.get(persistentCid)).rejects.toThrow('CID not found');
        expect(await persistentNode1.getMultiaddrs()).toHaveLength(0);
        expect(await persistentNode2.getMultiaddrs()).toHaveLength(0);
      } finally {
        await memNode1.stop();
        await memNode2.stop();
        await persistentNode1.stop();
        await persistentNode2.stop();
        await rm(tempDir1, { recursive: true, force: true });
        await rm(tempDir2, { recursive: true, force: true });
        console.error = originalConsoleError;
      }
    });

    it('should allow network communication when enabled', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'));
      
      // Create two networked nodes (one memory, one persistent for thorough testing)
      const memNode = new IpfsNode({ 
        storage: 'memory',
        enableNetworking: true,
        listenAddresses: ['/ip4/127.0.0.1/tcp/0']
      });
      
      const persistentNode = new IpfsNode({
        storage: 'persistent',
        storageConfig: { directory: tempDir },
        enableNetworking: true,
        listenAddresses: ['/ip4/127.0.0.1/tcp/0']
      });

      try {
        await memNode.init();
        await persistentNode.init();

        // Get memNode's multiaddr and connect persistentNode to it
        const memNodeAddrs = await memNode.getMultiaddrs();
        expect(memNodeAddrs.length).toBeGreaterThan(0);
        
        // Connect the nodes
        await persistentNode.dial(memNodeAddrs[0]);

        // Add data to memNode
        const testData = 'test data for network sharing';
        const cid = await memNode.add(new TextEncoder().encode(testData));

        // persistentNode should be able to retrieve the data
        const retrievedData = await persistentNode.get(cid);
        expect(new TextDecoder().decode(retrievedData)).toBe(testData);
      } finally {
        await memNode.stop();
        await persistentNode.stop();
        await rm(tempDir, { recursive: true, force: true });
      }
    }, 10000);
  });

  describe('Data Export/Import', () => {
    it('should support data export/import between different storage types', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'));
      
      // Create one memory node and one persistent node
      const memNode = new IpfsNode({ 
        storage: 'memory',
        enableNetworking: false
      });
      
      const persistentNode = new IpfsNode({
        storage: 'persistent',
        storageConfig: { directory: tempDir },
        enableNetworking: false
      });

      try {
        await memNode.init();
        await persistentNode.init();

        // Add data to memory node
        const testData = new TextEncoder().encode('test data for export/import');
        const originalCid = await memNode.add(testData);
        
        // Export from memory node
        const exportedData = await memNode.exportData(originalCid);
        
        // Import to persistent node
        const importedCid = await persistentNode.importData(exportedData.data);
        
        // Verify CIDs match
        expect(importedCid).toBe(originalCid);
        
        // Verify content is accessible and identical
        const retrievedData = await persistentNode.get(importedCid);
        expect(retrievedData).toEqual(testData);
      } finally {
        await memNode.stop();
        await persistentNode.stop();
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
}); 