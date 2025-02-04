/**
 * @file IpfsNode Test Suite
 * @version 1.0.0
 * @status STABLE - COMPLETE TEST COVERAGE
 * @lastModified 2024-02-03
 * 
 * Tests for core IPFS node functionality.
 * 
 * Test Coverage:
 * - Node lifecycle (init/stop)
 * - Storage operations (memory/persistent)
 * - Network operations
 * - Data operations (add/get)
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IpfsNode } from '../ipfsNode';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper function to suppress expected errors
const suppressExpectedErrors = (fn: () => Promise<any>, patterns: string[] = []) => {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    const shouldSuppress = patterns.some(pattern => errorMessage.includes(pattern));
    if (!shouldSuppress) {
      originalConsoleError(...args);
    }
  };

  return fn().finally(() => {
    console.error = originalConsoleError;
  });
};

describe('IpfsNode', () => {
  describe('Node Lifecycle', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('should initialize and stop correctly', async () => {
      const node = new IpfsNode({
        storage: 'persistent',
        storageConfig: { directory: tempDir }
      });

      await node.init();
      expect(node['isInitialized']).toBe(true);
      
      await node.stop();
      expect(node['isInitialized']).toBe(false);
    });

    it('should handle multiple init calls gracefully', async () => {
      const node = new IpfsNode({
        storage: 'memory'
      });

      await node.init();
      await node.init(); // Should not throw
      expect(node['isInitialized']).toBe(true);
      
      await node.stop();
    });

    it('should cleanup resources on stop', async () => {
      const node = new IpfsNode({
        storage: 'memory'
      });

      await node.init();
      await node.stop();

      expect(node['helia']).toBeNull();
      expect(node['blockstore']).toBeNull();
      expect(node['fs']).toBeNull();
      expect(node['cidMap'].size).toBe(0);
    });
  });

  describe('Storage Operations', () => {
    it('should store and retrieve data in memory', async () => {
      const node = new IpfsNode({
        storage: 'memory'
      });

      try {
        await node.init();
        
        const data = new TextEncoder().encode('Hello, IPFS!');
        const cid = await node.add(data);
        
        const retrieved = await node.get(cid);
        expect(new TextDecoder().decode(retrieved)).toBe('Hello, IPFS!');
      } finally {
        await node.stop();
      }
    });

    it('should persist data in filesystem', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'));
      const node = new IpfsNode({
        storage: 'persistent',
        storageConfig: { directory: tempDir }
      });

      try {
        await node.init();
        
        const data = new TextEncoder().encode('Persist me!');
        const cid = await node.add(data);
        
        // Stop and restart node
        await node.stop();
        await node.init();
        
        const retrieved = await node.get(cid);
        expect(new TextDecoder().decode(retrieved)).toBe('Persist me!');
      } finally {
        await node.stop();
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('should handle non-existent CIDs', async () => {
      const node = new IpfsNode({
        storage: 'memory'
      });

      try {
        await node.init();
        await suppressExpectedErrors(
          async () => {
            await expect(node.get('non-existent-cid')).rejects.toThrow('Invalid CID');
          },
          ['Invalid CID', 'Failed to get data']
        );
      } finally {
        await node.stop();
      }
    });
  });

  describe('Network Operations', () => {
    it('should handle offline mode correctly', async () => {
      const node = new IpfsNode({
        storage: 'memory',
        enableNetworking: false
      });

      try {
        await node.init();
        
        const addrs = await node.getMultiaddrs();
        expect(addrs).toHaveLength(0);
        
        await expect(node.dial('/ip4/127.0.0.1/tcp/4001'))
          .rejects.toThrow('Networking is disabled');
      } finally {
        await node.stop();
      }
    });

    it('should support networking when enabled', async () => {
      const node = new IpfsNode({
        storage: 'memory',
        enableNetworking: true,
        listenAddresses: ['/ip4/127.0.0.1/tcp/0']
      });

      try {
        await node.init();
        
        const addrs = await node.getMultiaddrs();
        expect(addrs.length).toBeGreaterThan(0);
        
        const peerId = await node.getPeerId();
        expect(peerId).not.toBeNull();
      } finally {
        await node.stop();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      const node = new IpfsNode({
        storage: 'persistent',
        storageConfig: { directory: '/nonexistent' }
      });

      await suppressExpectedErrors(
        async () => {
          await expect(node.init()).rejects.toThrow();
        },
        ['Failed to initialize IPFS node', 'ENOENT: no such file or directory']
      );
    });

    it('should handle operations on uninitialized node', async () => {
      const node = new IpfsNode({
        storage: 'memory'
      });

      const data = new TextEncoder().encode('Test');
      await expect(node.add(data)).rejects.toThrow('IPFS node not initialized');
      await expect(node.get('any-cid')).rejects.toThrow('IPFS node not initialized');
    });

    it('should validate storage configuration', () => {
      expect(() => new IpfsNode({
        storage: 'persistent'
        // Missing required directory
      })).toThrow('Storage directory is required for persistent storage');
    });
  });
}); 