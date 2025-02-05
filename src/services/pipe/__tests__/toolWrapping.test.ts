/**
 * @file Tool Wrapping Test Suite
 * @version 1.0.0
 * @status STABLE - COMPLETE TEST COVERAGE
 * @lastModified 2024-02-04
 * 
 * Tests for tool wrapping functionality.
 * 
 * IMPORTANT:
 * - Maintain complete test coverage
 * - Test all wrapping features
 * - Test configuration options
 * - Test error cases
 * 
 * Test Coverage:
 * - Basic Tool Wrapping
 *   - Property preservation
 *   - Functionality maintenance
 *   - Multiple tool handling
 * - IPFS Integration
 *   - Storage configuration
 *   - Scope settings
 *   - Pinning options
 */

import { describe, it, expect } from 'vitest';
import { Tool } from '../../../types/tool';
import { wrapTool } from '../toolWrapping';
import { IPFSClient } from '../../ipfs/ipfsClient';

// Mock IPFS client for testing
const mockIpfsClient = new IPFSClient({
  endpoint: 'http://localhost:5001',
  timeout: 30000,
  scope: 'private',
  pin: true
});

// Mock tool for testing
const mockTool: Tool = {
  name: 'mockTool',
  description: 'A mock tool for testing',
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input for the mock tool'
      }
    },
    required: ['input']
  },
  call: async (args: any) => {
    return { result: `Processed: ${(args as any).input}` };
  }
};

describe('Tool Wrapping', () => {
  describe('Basic Tool Wrapping', () => {
    it('should preserve original tool properties', () => {
      const wrappedTool = wrapTool(mockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        pin: true,
        scope: 'private'
      });

      expect(wrappedTool.name).toBe(mockTool.name);
      expect(wrappedTool.description).toContain(mockTool.description);
      expect(wrappedTool.parameters).toEqual(mockTool.parameters);
    });

    it('should maintain tool functionality', async () => {
      const wrappedTool = wrapTool(mockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        pin: true,
        scope: 'private'
      });

      const result = await wrappedTool.call({ input: 'test' });
      expect(result).toHaveProperty('result', 'Processed: test');
      expect(result).toHaveProperty('cid');
      expect(result).toHaveProperty('metadata');
    });

    it('should handle multiple tools', () => {
      const anotherMockTool: Tool = {
        name: 'anotherMockTool',
        description: 'Another mock tool for testing',
        parameters: mockTool.parameters,
        call: mockTool.call
      };

      const wrappedTool1 = wrapTool(mockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        pin: true,
        scope: 'private'
      });

      const wrappedTool2 = wrapTool(anotherMockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        pin: true,
        scope: 'private'
      });

      expect(wrappedTool1.name).toBe('mockTool');
      expect(wrappedTool2.name).toBe('anotherMockTool');
    });

    it('should enhance tool description with Pipe information', () => {
      const wrappedTool = wrapTool(mockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        pin: true,
        scope: 'private'
      });

      expect(wrappedTool.description).toContain('Enhanced by Pipe Protocol');
      expect(wrappedTool.description).toContain('IPFS storage');
      expect(wrappedTool.description).toContain('schema validation');
      expect(wrappedTool.description).toContain('token management');
    });
  });

  describe('IPFS Integration', () => {
    it('should store results in IPFS when configured', async () => {
      const wrappedTool = wrapTool(mockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        generateSchema: true,
        pin: true,
        scope: 'private'
      });

      const result = await wrappedTool.call({ input: 'test' });
      expect(result).toHaveProperty('cid');
      expect(result).toHaveProperty('schema');
      expect(result).toHaveProperty('schemaCid');
      expect(result.schema).toEqual({
        type: 'object',
        properties: {
          result: { type: 'string' }
        },
        required: ['result']
      });
      expect(result.metadata).toHaveProperty('tool', 'mockTool');
      expect(result.metadata).toHaveProperty('pinned', true);
    });

    it('should respect scope settings', async () => {
      const wrappedTool = wrapTool(mockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        pin: true,
        scope: 'public'
      });

      const result = await wrappedTool.call({ input: 'test' });
      expect(result.metadata).toHaveProperty('scope', 'public');
    });

    it('should handle pinning options', async () => {
      const wrappedTool = wrapTool(mockTool, {
        ipfsClient: mockIpfsClient,
        storeResult: true,
        pin: false,
        scope: 'private'
      });

      const result = await wrappedTool.call({ input: 'test' });
      expect(result.metadata).toHaveProperty('pinned', false);
    });
  });
}); 
