/**
 * @file IpfsClient Implementation
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * High-level IPFS client that provides application-specific operations
 * on top of the IpfsNode implementation.
 */

import { PipeRecord, Scope } from './types';
import { PipeRecordSchema } from './schema';
import { IpfsNode } from './services/ipfs/ipfsNode';
import { TextEncoder, TextDecoder } from 'util';

export class IpfsClient {
  private node: IpfsNode;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(node: IpfsNode) {
    this.node = node;
  }

  async init(): Promise<void> {
    try {
      // Ensure the node is initialized
      if (!this.node) {
        throw new Error('IPFS node not provided');
      }
    } catch (error) {
      console.error('Error initializing IPFS client:', error);
      throw error;
    }
  }

  async publish(record: PipeRecord): Promise<PipeRecord> {
    try {
      const validatedRecord = PipeRecordSchema.parse(record);
      const data = this.encoder.encode(JSON.stringify(validatedRecord));
      const cid = await this.node.add(data);
      
      return {
        ...validatedRecord,
        cid
      };
    } catch (error) {
      console.error('Error publishing record:', error);
      throw error;
    }
  }

  async fetch(cid: string, scope: Scope): Promise<PipeRecord> {
    try {
      const data = await this.node.get(cid);
      const content = this.decoder.decode(data);
      const record = JSON.parse(content);
      return {
        ...record,
        scope
      };
    } catch (error) {
      console.error('Error fetching record:', error);
      throw error;
    }
  }

  async replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void> {
    try {
      const content = await this.fetch(cid, fromScope);
      await this.publish({
        ...content,
        scope: toScope,
        pinned: true,
        accessPolicy: { hiddenFromLLM: false }
      });
    } catch (error) {
      console.error('Error replicating record:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    // Node cleanup is handled by the node itself
  }

  getStatus() {
    return {
      localNode: true,
      publicNode: this.node['enableNetworking'] || false
    };
  }

  async getNodeInfo(_scope: Scope) {
    const peerId = await this.node.getPeerId();
    return {
      peerId: peerId?.toString() || 'unknown'
    };
  }

  async getConfiguration(_scope: Scope) {
    const peerId = await this.node.getPeerId();
    const addrs = await this.node.getMultiaddrs();
    
    return {
      peerId: peerId?.toString() || 'unknown',
      addrs
    };
  }
} 

