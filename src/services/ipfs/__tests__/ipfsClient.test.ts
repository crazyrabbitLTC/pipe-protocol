/**
 * @file IpfsClient Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * Tests for the IpfsClient implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IPFSClient } from '../ipfsClient';
import { PipeRecord } from '../../../types';

describe('IpfsClient', () => {
  let client: IPFSClient;

  beforeEach(() => {
    client = new IPFSClient({
      endpoint: 'http://localhost:5001',
      timeout: 5000,
      scope: 'private',
      pin: true
    });

    // Initialize storage maps
    client['storedData'] = new Map();
    client['pinnedCids'] = new Map([
      ['private', new Set<string>()],
      ['public', new Set<string>()]
    ]);
  });

  afterEach(async () => {
    await client.stop();
    client['storedData'].clear();
    client['pinnedCids'].get('private')?.clear();
    client['pinnedCids'].get('public')?.clear();
  });

  describe('Record Management', () => {
    it('should handle non-existent CIDs', async () => {
      const result = await client.fetch('non-existent-cid', 'private');
      expect(result).toBeNull();
    });

    it('should store and fetch records', async () => {
      const record: PipeRecord = {
        type: 'data',
        content: { message: 'test message' },
        scope: 'private',
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      };

      const cid = await client.store(record);
      expect(cid).toBeDefined();

      const fetched: any = await client.fetch(cid, 'private');
      expect(fetched).not.toBeNull();
      expect(fetched?.content).toEqual(record.content);

      // Test pinning operations
      await client.pin(cid, 'private');
      const pinnedCids = await client.getPinnedCids('private');
      expect(pinnedCids).toContain(cid);

      await client.unpin(cid, 'private');
      const afterUnpinCids = await client.getPinnedCids('private');
      expect(afterUnpinCids).not.toContain(cid);
    });
  });

  describe('Pinning Operations', () => {
    it('should pin and unpin records', async () => {
      const record: PipeRecord = {
        type: 'data',
        content: { message: 'Pin me!' },
        scope: 'private',
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      };

      const cid = await client.store(record);
      expect(cid).toBeDefined();
      
      // Verify it's in pinned records
      const pinnedBefore = await client.getPinnedCids('private');
      expect(pinnedBefore).toContain(cid);

      // Unpin and verify
      await client.unpin(cid, 'private');
      const pinnedAfter = await client.getPinnedCids('private');
      expect(pinnedAfter).not.toContain(cid);
    });
  });

  describe('Record Replication', () => {
    it('should replicate records between scopes', async () => {
      const content = { message: 'Test data' };
      
      // Store the initial record
      const cid = await client.store(content, { scope: 'private' });
      
      // Replicate from private to public
      const newCid = await client.replicate(cid, 'private', 'public');
      
      // Verify the original record is still in private scope
      const originalContent = await client.fetch(cid, 'private');
      expect(originalContent).not.toBeNull();
      expect(originalContent).toEqual(content);
      
      // Verify the replicated record is in public scope
      const replicatedContent = await client.fetch(newCid, 'public');
      expect(replicatedContent).not.toBeNull();
      expect(replicatedContent).toEqual(content);
    });
  });

  describe('Storage Metrics', () => {
    it('should track pinned records in metrics', async () => {
      const record: PipeRecord = {
        type: 'data',
        content: { message: 'Track me!' },
        scope: 'private',
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      };

      const metricsBefore = await client.getStorageMetrics('private');
      const cid = await client.store(record);
      expect(cid).toBeDefined();
      
      const metricsAfter = await client.getStorageMetrics('private');
      expect(metricsAfter.numObjects).toBe(metricsBefore.numObjects + 1);
    });
  });

  describe('Node Information', () => {
    it('should get node status', () => {
      const status = client.getStatus();
      expect(status).toHaveProperty('localNode');
      expect(status).toHaveProperty('publicNode');
    });

    it('should get node info', async () => {
      const info = await client.getNodeInfo('private');
      expect(info).toBeDefined();
    });

    it('should get storage metrics', async () => {
      const metrics = await client.getStorageMetrics('private');
      expect(metrics).toHaveProperty('totalSize');
      expect(metrics).toHaveProperty('numObjects');
    });
  });

  describe('Scope Management', () => {
    it('should handle different scopes correctly', async () => {
      const privateRecord: PipeRecord = {
        type: 'data',
        content: { private: true },
        scope: 'private',
        pinned: false,
        accessPolicy: { hiddenFromLLM: false }
      };

      const cid = await client.store(privateRecord);
      expect(cid).toBeDefined();
      
      const fetchedPrivate: any = await client.fetch(cid, 'private');
      expect(fetchedPrivate).not.toBeNull();
      expect(fetchedPrivate?.content).toEqual(privateRecord.content);
      expect(fetchedPrivate?.scope).toBe('private');
    });

    it('should prevent cross-scope access', async () => {
      const record: PipeRecord = {
        type: 'data',
        content: { test: 'data' },
        scope: 'private',
        pinned: false,
        accessPolicy: { hiddenFromLLM: false }
      };

      const cid = await client.store(record);
      expect(cid).toBeDefined();
      
      const fetchedPrivate: any = await client.fetch(cid, 'private');
      expect(fetchedPrivate).not.toBeNull();
      expect(fetchedPrivate?.content).toEqual(record.content);
      expect(fetchedPrivate?.scope).toBe('private');

      const fetchedPublic: any = await client.fetch(cid, 'public');
      expect(fetchedPublic).toBeNull();
    });
  });
}); 
