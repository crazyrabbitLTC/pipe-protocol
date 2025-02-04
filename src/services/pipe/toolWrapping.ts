/**
 * @file Tool Wrapping Implementation
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-04
 * 
 * Core functionality for wrapping tools with IPFS capabilities
 * 
 * IMPORTANT:
 * - All modifications must maintain test coverage
 * - Token counting must be accurate
 * 
 * Functionality:
 * - Tool wrapping with IPFS integration
 * - Parameter enhancement
 * - Token counting and limits
 * - Return schema validation
 */

import { Tool, ToolParameters } from '../../types/tool';
import { generateSchema } from './schemaGeneration';
import { countTokens, enforceTokenLimit } from './tokenCounting';

interface PipeOptions {
  scope?: 'private' | 'public';
  storeResult?: boolean;
  generateSchema?: boolean;
  pin?: boolean;
  maxTokens?: number;
}

interface PipeResult {
  cid: string;
  schemaCid: string;
  description: string;
  type: string;
  metadata: {
    tool: string;
    scope: string;
    pinned: boolean;
    tokenCount: number;
    truncated?: boolean;
  };
  data?: any;
}

/**
 * Enhances tool parameters with pipe-specific options
 */
function enhanceParameters(parameters: ToolParameters): ToolParameters {
  return {
    type: 'object',
    properties: {
      ...parameters.properties,
      pipeOptions: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['private', 'public'],
            default: 'private'
          },
          storeResult: {
            type: 'boolean',
            default: true
          },
          generateSchema: {
            type: 'boolean',
            default: true
          },
          pin: {
            type: 'boolean',
            default: true
          },
          maxTokens: {
            type: 'number',
            description: 'Maximum number of tokens allowed in the result'
          }
        }
      }
    },
    required: parameters.required || []
  };
}

/**
 * Generates the return schema for wrapped tools
 */
function generateReturnSchema() {
  return {
    type: 'object',
    properties: {
      cid: {
        type: 'string',
        description: 'IPFS CID of the stored result'
      },
      schemaCid: {
        type: 'string',
        description: 'IPFS CID of the result schema'
      },
      description: {
        type: 'string',
        description: 'Description of the result'
      },
      type: {
        type: 'string',
        description: 'Type of the result'
      },
      metadata: {
        type: 'object',
        properties: {
          tool: {
            type: 'string',
            description: 'Name of the tool that generated the result'
          },
          scope: {
            type: 'string',
            enum: ['private', 'public']
          },
          pinned: {
            type: 'boolean'
          },
          tokenCount: {
            type: 'number',
            description: 'Number of tokens in the result'
          },
          truncated: {
            type: 'boolean',
            description: 'Whether the result was truncated due to token limit'
          }
        },
        required: ['tool', 'scope', 'pinned', 'tokenCount']
      }
    },
    required: ['cid', 'schemaCid', 'description', 'type', 'metadata']
  };
}

/**
 * Wraps a single tool with IPFS capabilities
 */
function wrapTool(tool: Tool): Tool {
  return {
    name: tool.name,
    description: tool.description,
    parameters: enhanceParameters(tool.parameters),
    returns: generateReturnSchema(),
    call: async (params: any) => {
      // Get pipe options with defaults
      const pipeOptions: PipeOptions = {
        scope: 'private',
        storeResult: true,
        generateSchema: true,
        pin: true,
        ...params.pipeOptions
      };

      // Call original tool
      const result = await tool.call(params);

      // Count tokens in the result
      const tokenCount = countTokens(result);

      // Apply token limit if specified
      let finalResult = result;
      let truncated = false;

      if (pipeOptions.maxTokens && tokenCount > pipeOptions.maxTokens) {
        finalResult = enforceTokenLimit(result, pipeOptions.maxTokens);
        truncated = true;
      }

      // Generate schema for the result
      const resultSchema = generateSchema(finalResult);

      // TODO: Implement IPFS storage for both result and schema
      // For now, return a mock result
      return {
        cid: 'mock-cid',
        schemaCid: 'mock-schema-cid',
        description: `Result from ${tool.name}`,
        type: resultSchema.type,
        metadata: {
          tool: tool.name,
          scope: pipeOptions.scope,
          pinned: pipeOptions.pin,
          tokenCount,
          ...(truncated && { truncated })
        },
        data: pipeOptions.storeResult ? undefined : finalResult
      };
    }
  };
}

/**
 * Wraps an array of tools with IPFS capabilities
 */
export function pipe(tools: Tool[]): Tool[] {
  return tools.map(wrapTool);
} 
