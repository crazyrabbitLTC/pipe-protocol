/**
 * @file Pipe Class Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-04
 * 
 * Tests for the Pipe class functionality
 * 
 * Test Coverage:
 * - Configuration handling
 * - Tool wrapping
 * - Hook system
 * - IPFS integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Pipe } from '../../../pipe';
import { Tool } from '../../../types/tool';

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

describe('Pipe', () => {
  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const pipe = new Pipe();
      const tools = pipe.wrap([mockTool]);
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe(mockTool.name);
    });

    it('should accept custom configuration', () => {
      const pipe = new Pipe({
        ipfs: {
          endpoint: 'http://custom:5001',
          scope: 'public',
          pin: false
        },
        defaults: {
          maxTokens: 100,
          storeResult: false
        }
      });
      const tools = pipe.wrap([mockTool]);
      expect(tools).toHaveLength(1);
    });
  });

  describe('Hook System', () => {
    let pipe: Pipe;
    const mockBeforeStore = vi.fn(data => data);
    const mockAfterStore = vi.fn();

    beforeEach(() => {
      pipe = new Pipe();
      pipe.addHooks([
        {
          name: 'beforeStore',
          type: 'beforeStore',
          handler: mockBeforeStore
        },
        {
          name: 'afterStore',
          type: 'afterStore',
          handler: mockAfterStore
        }
      ]);
    });

    it('should execute hooks in order', async () => {
      const tools = pipe.wrap([mockTool]);
      const result = await tools[0].call({ input: 'test' });
      
      expect(mockBeforeStore).toHaveBeenCalled();
      expect(mockAfterStore).toHaveBeenCalled();
      expect(result).toHaveProperty('cid');
    });

    it('should allow removing hooks', () => {
      pipe.removeHook('beforeStore');
      expect(pipe['hooks']).toHaveLength(1);
      expect(pipe['hooks'][0].name).toBe('afterStore');
    });
  });

  describe('Tool Wrapping', () => {
    let pipe: Pipe;

    beforeEach(() => {
      pipe = new Pipe();
    });

    it('should wrap tools with IPFS capabilities', async () => {
      const tools = pipe.wrap([mockTool]);
      const result = await tools[0].call({ input: 'test' });

      expect(result).toHaveProperty('cid');
      expect(result).toHaveProperty('schemaCid');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('tool', 'mockTool');
    });

    it('should respect token limits', async () => {
      const pipe = new Pipe({
        defaults: {
          maxTokens: 5
        }
      });

      const tools = pipe.wrap([mockTool]);
      const result = await tools[0].call({
        input: 'this is a very long input that should be truncated'
      });

      expect(result.metadata).toHaveProperty('truncated', true);
    });

    it('should handle schema generation', async () => {
      const tools = pipe.wrap([mockTool]);
      const result = await tools[0].call({
        input: 'test',
        pipeOptions: {
          generateSchema: true
        }
      });

      expect(result).toHaveProperty('schemaCid');
      expect(result.schemaCid).not.toBe('no-schema');
    });
  });

  describe('IPFS Integration', () => {
    let pipe: Pipe;

    beforeEach(() => {
      pipe = new Pipe();
    });

    it('should store and retrieve data', async () => {
      const data = { test: 'data' };
      const cid = await pipe.store(data);
      const retrieved = await pipe.retrieve(cid);
      expect(retrieved).toEqual(data);
    });

    it('should respect scope settings', async () => {
      const pipe = new Pipe({
        defaults: {
          scope: 'public'
        }
      });

      const tools = pipe.wrap([mockTool]);
      const result = await tools[0].call({
        input: 'test'
      });

      expect(result.metadata).toHaveProperty('scope', 'public');
    });

    it('should handle pinning options', async () => {
      const pipe = new Pipe({
        defaults: {
          pin: false
        }
      });

      const tools = pipe.wrap([mockTool]);
      const result = await tools[0].call({
        input: 'test'
      });

      expect(result.metadata).toHaveProperty('pinned', false);
    });
  });
}); 
