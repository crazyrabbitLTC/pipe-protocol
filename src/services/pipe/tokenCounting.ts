/**
 * @file Token Counting Implementation
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-04
 * 
 * Core functionality for counting and limiting tokens in data structures
 * 
 * IMPORTANT:
 * - All modifications must maintain test coverage
 * - Token counting must be accurate
 * 
 * Functionality:
 * - Token counting for various data types
 * - Token limit enforcement
 * - Circular reference handling
 */

// Using a simple tokenization approach for demonstration
// In a production environment, you might want to use a more sophisticated tokenizer
function tokenizeString(str: string): string[] {
  return str.split(/\s+/).filter(Boolean);
}

/**
 * Counts tokens in a value, handling different types appropriately
 */
export function countTokens(value: any, seen = new WeakSet()): number {
  if (value === null || value === undefined) {
    return 0;
  }

  // Handle circular references
  if (typeof value === 'object' && seen.has(value)) {
    return 0;
  }

  switch (typeof value) {
  case 'string': {
    const tokens = tokenizeString(value);
    return tokens.length || 1; // Count empty string as 1 token
  }
    
  case 'number':
    return 1; // Count numbers as 1 token
    
  case 'boolean':
    return 1;
    
  case 'object':
    if (seen.has(value)) {
      return 0;
    }
    seen.add(value);

    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + countTokens(item, seen), 0);
    }

    return Object.entries(value).reduce((sum, [_key, val]) => {
      return sum + 1 + countTokens(val, seen); // Count each key as 1 token
    }, 0);

  default:
    return 0;
  }
}

/**
 * Enforces a token limit on a value while trying to preserve structure
 */
export function enforceTokenLimit(value: any, limit: number): any {
  // Handle invalid limits
  if (limit <= 0) {
    return null;
  }

  // Early return if value is within limit
  const totalTokens = countTokens(value);
  if (totalTokens <= limit) {
    return value;
  }

  // Handle primitive types
  if (typeof value !== 'object' || value === null) {
    if (typeof value === 'string') {
      const tokens = tokenizeString(value);
      if (tokens.length === 0 || limit < 2) return null;
      
      let result = tokens[0];
      let currentCount = 1; // Start with 1 token

      for (let i = 1; i < tokens.length && currentCount < limit; i++) {
        const nextToken = tokens[i];
        if (currentCount + 1 <= limit) { // Each token counts as 1
          result += ' ' + nextToken;
          currentCount += 1;
        } else {
          break;
        }
      }

      return currentCount <= limit ? result : null;
    }
    return null;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const result: any[] = [];
    let currentCount = 0;

    for (const item of value) {
      const itemTokens = countTokens(item);
      if (currentCount + itemTokens <= limit) {
        result.push(item);
        currentCount += itemTokens;
      } else {
        const remaining = limit - currentCount;
        if (remaining > 1) { // Need at least 2 tokens for any meaningful content
          const truncated = enforceTokenLimit(item, remaining);
          if (truncated !== null) {
            result.push(truncated);
            currentCount += countTokens(truncated);
          }
        }
        break;
      }
    }

    return result.length > 0 ? result : null;
  }

  // Handle objects
  const result: { [key: string]: any } = {};
  let currentCount = 0;

  // Sort entries by importance (assuming shorter keys are more important)
  // and then by token count
  const entries = Object.entries(value).sort((a, b) => {
    const aKey = a[0];
    const bKey = b[0];
    if (aKey === 'important' && bKey !== 'important') return -1;
    if (bKey === 'important' && aKey !== 'important') return 1;
    const aCount = countTokens(a[1]);
    const bCount = countTokens(b[1]);
    return aCount - bCount;
  });

  for (const [key, val] of entries) {
    const keyTokens = 1; // Count each key as 1 token
    const valueTokens = countTokens(val);
    const totalTokens = keyTokens + valueTokens;

    if (currentCount + totalTokens <= limit) {
      result[key] = val;
      currentCount += totalTokens;
    } else {
      const remaining = limit - currentCount - keyTokens;
      if (remaining > 1) { // Need at least 2 tokens for any meaningful content
        const truncated = enforceTokenLimit(val, remaining);
        if (truncated !== null) {
          result[key] = truncated;
          currentCount += keyTokens + countTokens(truncated);
        }
      }
    }

    if (currentCount >= limit) {
      break;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
} 
