/**
 * @file Tool Wrapping Implementation
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-04
 * 
 * Tool wrapping functionality with IPFS integration.
 * 
 * IMPORTANT:
 * - All modifications must maintain test coverage
 * - Preserve original tool functionality
 * - Handle hook execution order
 * - Respect configuration settings
 * - Token counting must be accurate
 * 
 * Functionality:
 * - Tool wrapping with IPFS capabilities
 * - Token counting and limiting
 * - Schema generation
 * - Hook system integration
 * - Metadata management
 * - Result transformation
 */

import { Tool } from '../../types/tool';
import { IPFSClient } from '../ipfs/ipfsClient';
import { generateSchema } from './schemaGeneration';
import { countTokens, enforceTokenLimit } from './tokenCounting';

export interface WrappedToolConfig {
  ipfsClient: IPFSClient;
  maxTokens?: number;
  storeResult?: boolean;
  generateSchema?: boolean;
  scope?: 'public' | 'private';
  pin?: boolean;
  hooks?: {
    beforeStore?: (data: unknown) => Promise<unknown>;
    afterStore?: (data: unknown) => Promise<unknown>;
  };
}

export function wrapTool(tool: Tool, config: WrappedToolConfig): Tool {
  const pipeDescription = `${tool.description}

Additional Information:
This tool is wrapped by Pipe Protocol, providing IPFS storage capabilities. The tool's output includes:
- cid: IPFS Content Identifier for the stored result
- schemaCid: IPFS Content Identifier for the result's JSON schema
- metadata: Additional information including tool name, storage scope, and pinning status`;

  return {
    ...tool,
    description: pipeDescription,
    call: async (args: unknown) => {
      // Call the original tool
      const result = await tool.call(args);

      // Process the result through hooks if they exist
      let processedResult = result;
      if (config.hooks?.beforeStore) {
        processedResult = await config.hooks.beforeStore(result);
      }

      // Apply token limit if specified
      let truncated = false;
      if (config.maxTokens) {
        const tokenCount = countTokens(processedResult);
        if (tokenCount > config.maxTokens) {
          processedResult = enforceTokenLimit(processedResult, config.maxTokens);
          truncated = true;
        }
      }

      // Store the result in IPFS if configured
      if (config.storeResult) {
        // Generate schema if requested
        let schemaCid = 'no-schema';
        if (config.generateSchema) {
          const schema = generateSchema(processedResult);
          schemaCid = await config.ipfsClient.store(schema, {
            pin: config.pin,
            scope: config.scope
          });
        }

        // Store the result
        const cid = await config.ipfsClient.store(processedResult, {
          pin: config.pin,
          scope: config.scope
        });

        if (config.hooks?.afterStore) {
          await config.hooks.afterStore({ result: processedResult, cid, schemaCid });
        }

        return {
          ...processedResult,
          cid,
          schemaCid,
          metadata: {
            tool: tool.name,
            truncated,
            pinned: config.pin,
            scope: config.scope
          }
        };
      }

      return processedResult;
    }
  };
}
