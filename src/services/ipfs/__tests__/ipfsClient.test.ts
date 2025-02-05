/**
 * @file IpfsClient Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * Tests for the IpfsClient implementation, focusing on higher-level operations
 * built on top of the core IpfsNode functionality.
 * 
 * Test Coverage:
 * - Record management (publish/fetch)
 * - Pinning operations
 * - Record replication
 * - Storage metrics
 * - Node information and configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IpfsClient } from '../../../ipfsClient';
import { IpfsNode } from '../ipfsNode';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper function to suppress expected errors
const suppressExpectedErrors = (fn: () => Promise<any>) => {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if (!errorMessage.includes('Invalid CID') && 
        !errorMessage.includes('Failed to get data') &&
        !errorMessage.includes('Error fetching record')) {
      originalConsoleError(...args);
    }
  };

  return fn().finally(() => {
    console.error = originalConsoleError;
  });
};

describe('IpfsClient', () => {
  let node: IpfsNode;
  let client: IpfsClient;
  let tempDir: string;

  beforeEach(async () => {
    // Create a persistent node for testing
    tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'));
    node = new IpfsNode({
      storage: 'persistent',
      storageConfig: { directory: tempDir }
    });
    await node.init();
    
    // Create client using the node
    client = new IpfsClient(node);
    await client.init();
  });

  afterEach(async () => {
    await client.stop();
    await node.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('Record Management', () => {
    it('should publish and fetch records', async () => {
      const record = {
        content: { message: 'Hello, IPFS!' },
        scope: 'private',
        type: 'data',
        pinned: false,
        accessPolicy: { hiddenFromLLM: false }
      };

      // Publish record
      const published = await client.publish(record);
      expect(published.cid).toBeDefined();
      expect(published).toEqual(expect.objectContaining(record));

      // Fetch record
      const fetched = await client.fetch(published.cid, 'private');
      expect(fetched?.content).toEqual(record);
    });

    it('should handle non-existent records gracefully', async () => {
      await suppressExpectedErrors(async () => {
        const fetched = await client.fetch('non-existent-cid', 'private');
        expect(fetched).toBeNull();
      });
    });
  });

  describe('Pinning Operations', () => {
    it('should pin and unpin records', async () => {
      const content = { message: 'Pin me!' };
      const record = {
        content,
        scope: 'private',
        type: 'data',
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      };

      // Publish and pin record
      const published = await client.publish(record);
      
      // Verify it's in pinned records
      const pinnedBefore = await client.getPinnedCids('private');
      expect(pinnedBefore).toContain(published.cid);

      // Unpin and verify
      await client.unpin(published.cid, 'private');
      const pinnedAfter = await client.getPinnedCids('private');
      expect(pinnedAfter).not.toContain(published.cid);
    });
  });

  describe('Record Replication', () => {
    it('should replicate records between scopes', async () => {
      const record = {
        content: { message: 'Replicate me!' },
        scope: 'private',
        type: 'data',
        pinned: false,
        accessPolicy: { hiddenFromLLM: false }
      };

      // Publish to private scope
      const published = await client.publish(record);

      // Replicate to public scope
      await client.replicate(published.cid, 'private', 'public');

      // Fetch from public scope
      const fetched = await client.fetch(published.cid, 'public');
      expect(fetched?.content).toEqual(record);
      expect(fetched?.scope).toBe('public');
    });

    it('should maintain data integrity during replication', async () => {
      const content = { message: 'Check my integrity!' };
      const record = {
        content,
        scope: 'private',
        type: 'data',
        pinned: false,
        accessPolicy: { hiddenFromLLM: false }
      };

      const published = await client.publish(record);
      
      // This should not throw as CIDs should match
      await client.replicate(published.cid, 'private', 'public');
      
      // Attempting to replicate non-existent data should fail
      await suppressExpectedErrors(async () => {
        await expect(client.replicate('non-existent-cid', 'private', 'public'))
          .rejects.toThrow();
      });
    });
  });

  describe('Storage Metrics', () => {
    it('should track pinned records in metrics', async () => {
      const content = { message: 'Track me!' };
      const record = {
        content,
        scope: 'private',
        type: 'data',
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      };

      const metricsBefore = await client.getStorageMetrics('private');
      await client.publish(record);
      const metricsAfter = await client.getStorageMetrics('private');

      expect(metricsAfter.numObjects).toBe(metricsBefore.numObjects + 1);
    });
  });

  describe('Node Information', () => {
    it('should provide correct node status', () => {
      const status = client.getStatus();
      expect(status.localNode).toBe(true);
      expect(status.publicNode).toBe(false); // Default is offline mode
    });

    it('should provide node configuration', async () => {
      const config = await client.getConfiguration('private');
      expect(config.peerId).toBeDefined();
      expect(Array.isArray(config.addrs)).toBe(true);
    });
  });

  describe('Data Export/Import', () => {
    it('should export and import data correctly', async () => {
      const record = {
        content: { message: 'Export me!' },
        scope: 'private',
        type: 'data',
        pinned: false,
        accessPolicy: { hiddenFromLLM: false }
      };

      // Publish and export
      const published = await client.publish(record);
      const exported = await client.exportData(published.cid);
      
      // Import and verify
      const importedCid = await client.importData(exported.data);
      expect(importedCid).toBe(published.cid);

      const fetched = await client.fetch(importedCid, 'private');
      expect(fetched?.content).toEqual(record);
    });
  });

  describe('Scope Management', () => {
    it('should handle different scopes correctly', async () => {
      const privateRecord = {
        type: 'data',
        content: { private: true },
        scope: 'private'
      };

      // Store private record
      const publishedPrivate = await client.publish(privateRecord);
      expect(publishedPrivate.cid).toBeDefined();

      // Verify records are accessible in their respective scopes
      const fetchedPrivate = await client.fetch(publishedPrivate.cid, 'private');
      expect(fetchedPrivate).toEqual(privateRecord.content);
    });

    it('should prevent cross-scope access', async () => {
      const record = {
        type: 'data',
        content: { test: 'data' },
        scope: 'private'
      };

      const publishedRecord = await client.publish(record);
      expect(publishedRecord.cid).toBeDefined();

      // Attempt to access private record from public scope should fail
      await expect(client.fetch(publishedRecord.cid, 'public')).rejects.toThrow();
    });
  });
}); 
