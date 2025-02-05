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
  // Generate hook documentation if hooks are present
  const hookDocs = config.hooks ? `\nHooks: ${config.hooks.beforeStore ? 'pre-store, ' : ''}${config.hooks.afterStore ? 'post-store' : ''}` : '';

  const pipeDescription = `${tool.description}

Enhanced by Pipe Protocol with IPFS storage, schema validation, and token management.${hookDocs}

Outputs: CID, schema, metadata, and execution details.`;

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
        let schema = null;
        let schemaCid = 'no-schema';
        if (config.generateSchema) {
          schema = generateSchema(processedResult);
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
          processedResult = await config.hooks.afterStore({ 
            ...processedResult, 
            cid, 
            schemaCid 
          });
        }

        return {
          ...processedResult,
          cid,
          schema,
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
