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
  private pinnedCids: Set<string> = new Set();

  constructor(node: IpfsNode) {
    this.node = node;
  }

  async init(): Promise<void> {
    try {
      if (!this.node) {
        throw new Error('IPFS node not provided');
      }
      await this.node.init();
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
      
      if (record.pinned) {
        await this.pin(cid, record.scope);
      }

      return {
        ...validatedRecord,
        cid
      };
    } catch (error) {
      console.error('Error publishing record:', error);
      throw error;
    }
  }

  async fetch(cid: string, scope: Scope): Promise<PipeRecord | null> {
    try {
      const data = await this.node.get(cid);
      const content = JSON.parse(this.decoder.decode(data));
      return {
        cid,
        content,
        type: 'data',
        scope,
        accessPolicy: { hiddenFromLLM: false }
      };
    } catch (error) {
      console.error('Error fetching record:', error);
      return null;
    }
  }

  async pin(cid: string, _scope: Scope): Promise<void> {
    try {
      // Verify the data exists by trying to get it
      await this.node.get(cid);
      this.pinnedCids.add(cid);
    } catch (error) {
      console.error('Error pinning data:', error);
      throw error;
    }
  }

  async unpin(cid: string, _scope: Scope): Promise<void> {
    try {
      this.pinnedCids.delete(cid);
    } catch (error) {
      console.error('Error unpinning data:', error);
      throw error;
    }
  }

  async replicate(cid: string, _fromScope: Scope, _toScope: Scope): Promise<void> {
    try {
      // Get the data from the source scope
      const data = await this.node.get(cid);
      // Add it back to create a new copy
      const newCid = await this.node.add(data);
      
      if (newCid !== cid) {
        throw new Error('Data integrity check failed during replication');
      }
    } catch (error) {
      console.error('Error replicating data:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.node.stop();
  }

  getStatus() {
    return {
      localNode: true,
      publicNode: false // Default to offline mode
    };
  }

  getNodeInfo(_scope: Scope) {
    return this.node.getPeerId().then(peerId => ({
      peerId: peerId?.toString() || 'unknown'
    }));
  }

  async getConfiguration(_scope: Scope) {
    const [peerId, addrs] = await Promise.all([
      this.node.getPeerId(),
      this.node.getMultiaddrs()
    ]);
    
    return {
      peerId: peerId?.toString() || 'unknown',
      addrs
    };
  }

  async getStorageMetrics(_scope: Scope): Promise<{ totalSize: number; numObjects: number }> {
    return {
      totalSize: 0, // Implement actual size calculation if needed
      numObjects: this.pinnedCids.size
    };
  }

  async getPinnedCids(_scope: Scope): Promise<string[]> {
    return Array.from(this.pinnedCids);
  }

  async exportData(cid: string): Promise<{ data: Uint8Array; cid: string }> {
    const data = await this.node.get(cid);
    return { data, cid };
  }

  async importData(data: Uint8Array): Promise<string> {
    return await this.node.add(data);
  }
} 

