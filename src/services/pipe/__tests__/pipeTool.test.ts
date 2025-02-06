/**
 * @file Pipe Tool Test Suite
 * @version 1.0.0
 * @status STABLE - COMPLETE TEST COVERAGE
 * @lastModified 2024-02-04
 * 
 * Tests for Pipe tool functionality
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { IPFSClient } from '../../ipfs/ipfsClient';
import { createPipeTool } from '../pipeTool';
import { PipeRecord } from '../../../types';

describe('Pipe Tool', () => {
  let mockIpfsClient: IPFSClient;

  beforeEach(() => {
    mockIpfsClient = {
      config: {
        endpoint: 'http://localhost:5001',
        timeout: 5000,
        scope: 'private',
        pin: true
      },
      storedData: new Map(),
      pinnedCids: new Map<string, Set<string>>(),
      fetch: vi.fn(),
      pin: vi.fn(),
      unpin: vi.fn(),
      replicate: vi.fn(),
      getPinnedCids: vi.fn(),
      getStatus: vi.fn(),
      getNodeInfo: vi.fn(),
      getStorageMetrics: vi.fn(),
      getConfiguration: vi.fn(),
      stop: vi.fn(),
      store: vi.fn()
    } as unknown as IPFSClient;

    // Setup default mock implementations
    const defaultRecord: PipeRecord = {
      type: 'data',
      content: { test: 'data' },
      scope: 'private',
      pinned: false,
      accessPolicy: { hiddenFromLLM: false }
    };

    (mockIpfsClient.fetch as Mock).mockResolvedValue(defaultRecord);
    (mockIpfsClient.pin as Mock).mockResolvedValue(undefined);
    (mockIpfsClient.unpin as Mock).mockResolvedValue(undefined);
  });

  it('should create a tool with correct interface', () => {
    const pipeTool = createPipeTool(mockIpfsClient);
    
    expect(pipeTool.name).toBe('pipe');
    expect(pipeTool.description).toContain('Access Pipe Protocol');
    expect(pipeTool.parameters.type).toBe('object');
    expect(pipeTool.parameters.properties).toHaveProperty('action');
    expect(pipeTool.parameters.properties).toHaveProperty('cid');
    expect(pipeTool.parameters.required).toContain('action');
    expect(pipeTool.parameters.required).toContain('cid');
  });

  it('should retrieve content', async () => {
    const mockContent: PipeRecord = {
      type: 'data',
      content: { test: 'custom data' },
      scope: 'private',
      pinned: false,
      accessPolicy: { hiddenFromLLM: false }
    };

    (mockIpfsClient.fetch as Mock).mockResolvedValue(mockContent);

    const pipeTool = createPipeTool(mockIpfsClient);
    const result = await pipeTool.call({
      action: 'retrieve',
      cid: 'testCid'
    });

    expect(mockIpfsClient.fetch).toHaveBeenCalledWith('testCid', 'private');
    expect(result.content).toEqual(mockContent);
    expect(result.cid).toBe('testCid');
    expect(result.metadata.action).toBe('retrieve');
    expect(result.metadata.timestamp).toBeDefined();
  });

  it('should pin content', async () => {
    const pipeTool = createPipeTool(mockIpfsClient);
    (mockIpfsClient.pin as Mock).mockResolvedValue(undefined);

    const result = await pipeTool.call({
      action: 'pin',
      cid: 'testCid'
    });

    expect(mockIpfsClient.pin).toHaveBeenCalledWith('testCid', 'private');
    expect(result.success).toBe(true);
    expect(result.cid).toBe('testCid');
    expect(result.metadata.action).toBe('pin');
  });

  it('should unpin content', async () => {
    const pipeTool = createPipeTool(mockIpfsClient);
    (mockIpfsClient.unpin as Mock).mockResolvedValue(undefined);

    const result = await pipeTool.call({
      action: 'unpin',
      cid: 'testCid'
    });

    expect(mockIpfsClient.unpin).toHaveBeenCalledWith('testCid', 'private');
    expect(result.success).toBe(true);
    expect(result.cid).toBe('testCid');
    expect(result.metadata.action).toBe('unpin');
  });

  it('should get schema', async () => {
    const mockSchema: PipeRecord = {
      type: 'schema',
      content: { type: 'object', properties: {} },
      scope: 'private',
      pinned: false,
      accessPolicy: { hiddenFromLLM: false }
    };

    (mockIpfsClient.fetch as Mock).mockResolvedValue(mockSchema);

    const pipeTool = createPipeTool(mockIpfsClient);
    const result = await pipeTool.call({
      action: 'getSchema',
      cid: 'testCid'
    });

    expect(mockIpfsClient.fetch).toHaveBeenCalledWith('testCid', 'private');
    expect(result.schema).toEqual(mockSchema);
    expect(result.cid).toBe('testCid');
    expect(result.metadata.action).toBe('getSchema');
  });

  it('should throw error for unknown action', async () => {
    const pipeTool = createPipeTool(mockIpfsClient);

    await expect(pipeTool.call({
      action: 'invalid',
      cid: 'testCid'
    })).rejects.toThrow('Unknown action: invalid');
  });

  it('should respect scope parameter', async () => {
    const mockContent: PipeRecord = {
      type: 'data',
      content: { test: 'data' },
      scope: 'public',
      pinned: false,
      accessPolicy: { hiddenFromLLM: false }
    };

    (mockIpfsClient.fetch as Mock).mockResolvedValue(mockContent);

    const pipeTool = createPipeTool(mockIpfsClient);
    const result = await pipeTool.call({
      action: 'retrieve',
      cid: 'testCid',
      scope: 'public'
    });

    expect(result.metadata.scope).toBe('public');
  });
}); 