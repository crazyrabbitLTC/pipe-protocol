/**
 * @file Schema Generation Implementation
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-04
 * 
 * Core functionality for generating JSON Schema from data
 * 
 * IMPORTANT:
 * - All modifications must maintain test coverage
 * - Handle all edge cases carefully
 * 
 * Functionality:
 * - Type inference
 * - Object structure analysis
 * - Array type detection
 * - Required field detection
 */

interface JSONSchema {
  type: string;
  properties?: { [key: string]: JSONSchema };
  items?: JSONSchema | { oneOf: JSONSchema[] } | Record<string, never>;
  required?: string[];
  oneOf?: JSONSchema[];
}

/**
 * Determines the JSON Schema type of a value
 */
function getType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Checks if all items in an array are of the same type
 */
function hasSingleType(arr: any[]): boolean {
  if (arr.length <= 1) return true;
  const firstType = getType(arr[0]);
  return arr.every(item => getType(item) === firstType);
}

/**
 * Gets unique types from an array
 */
function getUniqueTypes(arr: any[]): Set<string> {
  return new Set(arr.map(getType));
}

/**
 * Generates schema for array items
 */
function generateArraySchema(arr: any[]): JSONSchema {
  if (arr.length === 0) {
    return {
      type: 'array',
      items: {}
    };
  }

  if (hasSingleType(arr)) {
    return {
      type: 'array',
      items: generateSchema(arr[0])
    };
  }

  const uniqueTypes = Array.from(getUniqueTypes(arr));
  return {
    type: 'array',
    items: {
      oneOf: uniqueTypes.map(type => {
        const itemOfType = arr.find(item => getType(item) === type);
        return generateSchema(itemOfType);
      })
    }
  };
}

/**
 * Generates schema for object properties
 */
function generateObjectSchema(obj: { [key: string]: any }): JSONSchema {
  const properties: { [key: string]: JSONSchema } = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    properties[key] = generateSchema(value);
    if (value !== undefined) {
      required.push(key);
    }
  }

  const schema: JSONSchema = {
    type: 'object',
    properties
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

/**
 * Generates a JSON Schema for any data structure
 */
export function generateSchema(data: any): JSONSchema {
  const type = getType(data);

  switch (type) {
  case 'array':
    return generateArraySchema(data);
  case 'object':
    return generateObjectSchema(data);
  default:
    return { type };
  }
} 