/**
 * @file Schema Generation Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-04
 * 
 * Tests for automatic JSON Schema generation from tool results
 * 
 * Test Coverage:
 * - Basic type inference
 * - Complex object structure handling
 * - Array type handling
 * - Nested object handling
 * - Required field detection
 */

import { describe, it, expect } from 'vitest';
import { generateSchema } from '../schemaGeneration';

describe('Schema Generation', () => {
  describe('Basic Type Inference', () => {
    it('should infer string type', () => {
      const data = "test string";
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'string'
      });
    });

    it('should infer number type', () => {
      const data = 42;
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'number'
      });
    });

    it('should infer boolean type', () => {
      const data = true;
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'boolean'
      });
    });

    it('should handle null values', () => {
      const data = null;
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'null'
      });
    });
  });

  describe('Object Structure Handling', () => {
    it('should generate schema for simple objects', () => {
      const data = {
        name: "test",
        count: 1,
        isActive: true
      };
      
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' },
          isActive: { type: 'boolean' }
        },
        required: ['name', 'count', 'isActive']
      });
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          id: 1,
          details: {
            name: "test"
          }
        }
      };
      
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              details: {
                type: 'object',
                properties: {
                  name: { type: 'string' }
                },
                required: ['name']
              }
            },
            required: ['id', 'details']
          }
        },
        required: ['user']
      });
    });
  });

  describe('Array Handling', () => {
    it('should handle arrays of primitive types', () => {
      const data = [1, 2, 3];
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'array',
        items: { type: 'number' }
      });
    });

    it('should handle arrays of objects', () => {
      const data = [
        { id: 1, name: "first" },
        { id: 2, name: "second" }
      ];
      
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' }
          },
          required: ['id', 'name']
        }
      });
    });

    it('should handle mixed type arrays', () => {
      const data = [1, "test", true];
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'array',
        items: {
          oneOf: [
            { type: 'number' },
            { type: 'string' },
            { type: 'boolean' }
          ]
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects', () => {
      const data = {};
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'object',
        properties: {}
      });
    });

    it('should handle empty arrays', () => {
      const data: any[] = [];
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'array',
        items: {}
      });
    });

    it('should handle undefined values', () => {
      const data = {
        optional: undefined
      };
      const schema = generateSchema(data);
      expect(schema).toEqual({
        type: 'object',
        properties: {
          optional: { type: 'undefined' }
        }
      });
    });
  });
}); 