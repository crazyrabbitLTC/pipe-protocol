/**
 * @file Token Counting Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-04
 * 
 * Tests for token counting functionality
 * 
 * Test Coverage:
 * - Basic token counting
 * - Complex data structure handling
 * - Token limit enforcement
 * - Edge cases
 */

import { describe, it, expect } from 'vitest';
import { countTokens, enforceTokenLimit } from '../tokenCounting';

describe('Token Counting', () => {
  describe('Basic Token Counting', () => {
    it('should count tokens in strings', () => {
      const data = "Hello world";
      const count = countTokens(data);
      expect(count).toBeGreaterThan(0);
    });

    it('should count tokens in numbers', () => {
      const data = 12345;
      const count = countTokens(data);
      expect(count).toBeGreaterThan(0);
    });

    it('should handle null and undefined', () => {
      expect(countTokens(null)).toBe(0);
      expect(countTokens(undefined)).toBe(0);
    });
  });

  describe('Complex Data Structure Handling', () => {
    it('should count tokens in objects', () => {
      const data = {
        name: "test",
        value: 123,
        nested: {
          field: "nested value"
        }
      };
      const count = countTokens(data);
      expect(count).toBeGreaterThan(0);
    });

    it('should count tokens in arrays', () => {
      const data = ["first", "second", { name: "third" }];
      const count = countTokens(data);
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Token Limit Enforcement', () => {
    it('should enforce token limits on strings', () => {
      const data = "This is a long string that might exceed the token limit";
      const result = enforceTokenLimit(data, 5);
      expect(countTokens(result)).toBeLessThanOrEqual(5);
    });

    it('should enforce token limits on objects', () => {
      const data = {
        field1: "value1",
        field2: "value2",
        field3: {
          nested: "nested value"
        }
      };
      const result = enforceTokenLimit(data, 10);
      expect(countTokens(result)).toBeLessThanOrEqual(10);
    });

    it('should preserve structure when possible', () => {
      const data = {
        important: "keep this",
        lessImportant: "might trim this"
      };
      const result = enforceTokenLimit(data, 5);
      expect(result).toHaveProperty('important');
    });

    it('should return null when limit is too small', () => {
      const data = "Cannot be smaller";
      const result = enforceTokenLimit(data, 1);
      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects and arrays', () => {
      expect(countTokens({})).toBe(0);
      expect(countTokens([])).toBe(0);
    });

    it('should handle circular references', () => {
      const circular: any = { name: "test" };
      circular.self = circular;
      expect(() => countTokens(circular)).not.toThrow();
    });

    it('should handle mixed content types', () => {
      const data = {
        string: "text",
        number: 123,
        bool: true,
        array: [1, "two", false],
        nested: {
          more: "content"
        }
      };
      expect(() => countTokens(data)).not.toThrow();
    });
  });
}); 