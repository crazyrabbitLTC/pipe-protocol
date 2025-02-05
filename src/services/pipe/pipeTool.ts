/**
 * @file Pipe Tool Implementation
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-04
 * 
 * Core Pipe functionality exposed as a tool
 */

import { Tool } from '../../types/tool';
import { IPFSClient } from '../ipfs/ipfsClient';

export function createPipeTool(ipfsClient: IPFSClient): Tool {
  return {
    name: 'pipe',
    description: 'Access Pipe Protocol functionality directly. Allows retrieval and management of stored data.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action to perform: retrieve, pin, unpin, getSchema',
          enum: ['retrieve', 'pin', 'unpin', 'getSchema']
        },
        cid: {
          type: 'string',
          description: 'The IPFS Content Identifier of the data'
        },
        scope: {
          type: 'string',
          description: 'The scope to operate in: private or public',
          enum: ['private', 'public']
        }
      },
      required: ['action', 'cid']
    },
    call: async (args: { action: string; cid: string; scope?: 'private' | 'public' }) => {
      const { action, cid } = args;

      switch (action) {
      case 'retrieve': {
        const content = await ipfsClient.fetch(cid);
        return {
          content,
          cid,
          metadata: {
            action: 'retrieve',
            timestamp: new Date().toISOString(),
            scope: args.scope || 'private'
          }
        };
      }

      case 'pin': {
        await ipfsClient.pin(cid);
        return {
          success: true,
          cid,
          metadata: {
            action: 'pin',
            timestamp: new Date().toISOString()
          }
        };
      }

      case 'unpin': {
        await ipfsClient.unpin(cid);
        return {
          success: true,
          cid,
          metadata: {
            action: 'unpin',
            timestamp: new Date().toISOString()
          }
        };
      }

      case 'getSchema': {
        const schemaContent = await ipfsClient.fetch(cid);
        return {
          schema: schemaContent,
          cid,
          metadata: {
            action: 'getSchema',
            timestamp: new Date().toISOString()
          }
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
      }
    }
  };
} 