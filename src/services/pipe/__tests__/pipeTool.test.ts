/**
 * @file Pipe Tool Test Suite
 * @version 1.0.0
 * @status STABLE - COMPLETE TEST COVERAGE
 * @lastModified 2024-02-04
 * 
 * Tests for Pipe tool functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPipeTool } from '../pipeTool';
import { IPFSClient } from '../../ipfs/ipfsClient';

describe('Pipe Tool', () => {
  let mockIpfsClient: jest.Mocked<IPFSClient>;

  beforeEach(() => {
    mockIpfsClient = {
      fetch: vi.fn(),
      pin: vi.fn(),
      unpin: vi.fn(),
      store: vi.fn(),
      replicate: vi.fn(),
      getPinnedCids: vi.fn(),
      getStatus: vi.fn(),
      getNodeInfo: vi.fn(),
      getStorageMetrics: vi.fn(),
      getConfiguration: vi.fn(),
      stop: vi.fn()
    } as unknown as jest.Mocked<IPFSClient>;
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
    const pipeTool = createPipeTool(mockIpfsClient);
    const mockContent = { data: 'test' };
    mockIpfsClient.fetch.mockResolvedValue(mockContent);

    const result = await pipeTool.call({
      action: 'retrieve',
      cid: 'testCid'
    });

    expect(mockIpfsClient.fetch).toHaveBeenCalledWith('testCid');
    expect(result.content).toEqual(mockContent);
    expect(result.cid).toBe('testCid');
    expect(result.metadata.action).toBe('retrieve');
    expect(result.metadata.timestamp).toBeDefined();
  });

  it('should pin content', async () => {
    const pipeTool = createPipeTool(mockIpfsClient);
    mockIpfsClient.pin.mockResolvedValue(undefined);

    const result = await pipeTool.call({
      action: 'pin',
      cid: 'testCid'
    });

    expect(mockIpfsClient.pin).toHaveBeenCalledWith('testCid');
    expect(result.success).toBe(true);
    expect(result.cid).toBe('testCid');
    expect(result.metadata.action).toBe('pin');
  });

  it('should unpin content', async () => {
    const pipeTool = createPipeTool(mockIpfsClient);
    mockIpfsClient.unpin.mockResolvedValue(undefined);

    const result = await pipeTool.call({
      action: 'unpin',
      cid: 'testCid'
    });

    expect(mockIpfsClient.unpin).toHaveBeenCalledWith('testCid');
    expect(result.success).toBe(true);
    expect(result.cid).toBe('testCid');
    expect(result.metadata.action).toBe('unpin');
  });

  it('should get schema', async () => {
    const pipeTool = createPipeTool(mockIpfsClient);
    const mockSchema = { type: 'object', properties: {} };
    mockIpfsClient.fetch.mockResolvedValue(mockSchema);

    const result = await pipeTool.call({
      action: 'getSchema',
      cid: 'testCid'
    });

    expect(mockIpfsClient.fetch).toHaveBeenCalledWith('testCid');
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
    const pipeTool = createPipeTool(mockIpfsClient);
    mockIpfsClient.fetch.mockResolvedValue({ data: 'test' });

    const result = await pipeTool.call({
      action: 'retrieve',
      cid: 'testCid',
      scope: 'public'
    });

    expect(result.metadata.scope).toBe('public');
  });
}); 