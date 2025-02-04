/**
 * @file Tool Wrapping Implementation
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-04
 * 
 * Tool wrapping functionality with IPFS integration
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
  return {
    ...tool,
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
