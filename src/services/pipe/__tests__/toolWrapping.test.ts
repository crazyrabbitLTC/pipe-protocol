/**
 * @file Tool Wrapping Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * Tests for the Pipe tool wrapping functionality.
 * 
 * Test Coverage:
 * - Basic tool wrapping
 * - Parameter enhancement
 * - Token counting and limits
 * - IPFS storage integration
 * - Return schema validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pipe } from '../toolWrapping';
import { PipeProtocol } from '../../../pipe';

// Mock tool for testing
const mockTool = {
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
    return { result: `Processed: ${args.input}` };
  }
};

describe('Tool Wrapping', () => {
  describe('Basic Tool Wrapping', () => {
    it('should preserve original tool properties', () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      expect(wrappedTool.name).toBe(mockTool.name);
      expect(wrappedTool.description).toBe(mockTool.description);
    });

    it('should maintain tool functionality', async () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      const result = await wrappedTool.call({ input: 'test' });
      expect(result).toHaveProperty('cid');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('tool', 'mockTool');
    });

    it('should handle multiple tools', () => {
      const anotherMockTool = {
        ...mockTool,
        name: 'anotherMockTool'
      };

      const wrappedTools = pipe([mockTool, anotherMockTool]);
      expect(wrappedTools).toHaveLength(2);
      expect(wrappedTools[0].name).toBe('mockTool');
      expect(wrappedTools[1].name).toBe('anotherMockTool');
    });
  });

  describe('Parameter Enhancement', () => {
    it('should add pipe options to tool parameters', () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      const params = wrappedTool.parameters;
      expect(params.properties).toHaveProperty('pipeOptions');
      expect(params.properties.pipeOptions.properties).toHaveProperty('scope');
      expect(params.properties.pipeOptions.properties).toHaveProperty('storeResult');
      expect(params.properties.pipeOptions.properties).toHaveProperty('generateSchema');
      expect(params.properties.pipeOptions.properties).toHaveProperty('pin');
      expect(params.properties.pipeOptions.properties).toHaveProperty('maxTokens');
    });

    it('should maintain original parameters', () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      expect(wrappedTool.parameters.properties).toHaveProperty('input');
      expect(wrappedTool.parameters.required).toContain('input');
    });

    it('should use default pipe options when not provided', async () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      const result = await wrappedTool.call({ input: 'test' });
      expect(result.metadata).toHaveProperty('scope', 'private');
      expect(result.metadata).toHaveProperty('pinned', true);
    });

    it('should respect provided pipe options', async () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      const result = await wrappedTool.call({
        input: 'test',
        pipeOptions: {
          scope: 'public',
          pin: false,
          storeResult: true,
          generateSchema: true
        }
      });

      expect(result.metadata).toHaveProperty('scope', 'public');
      expect(result.metadata).toHaveProperty('pinned', false);
    });
  });

  describe('Return Schema', () => {
    it('should provide a valid return schema', () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      expect(wrappedTool.returns).toBeDefined();
      expect(wrappedTool.returns).toMatchObject({
        type: 'object',
        properties: {
          cid: { type: 'string' },
          schemaCid: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string' },
          metadata: { type: 'object' }
        }
      });
    });

    it('should return results matching the schema', async () => {
      const wrappedTools = pipe([mockTool]);
      const wrappedTool = wrappedTools[0];

      const result = await wrappedTool.call({ input: 'test' });
      expect(result).toHaveProperty('cid');
      expect(result).toHaveProperty('schemaCid');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('metadata');
    });
  });
}); 
