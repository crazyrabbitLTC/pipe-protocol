import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { PipeRecord, PipeConfig, Scope } from './types';
import { config } from 'dotenv';
import { CID } from 'multiformats/cid';
import * as raw from 'multiformats/codecs/raw';
import { sha256 } from 'multiformats/hashes/sha2';
import { MemoryBlockstore } from 'blockstore-core';
config();

interface PipeIpfsOptions {
  localNodeEndpoint?: string;
  publicNodeEndpoint?: string;
}

export class IpfsClient {
  private localNode: IPFSHTTPClient;
  private publicNode: IPFSHTTPClient;
  private isRunning: boolean = false;
  private machineNode?: IPFSHTTPClient;
  private userNode?: IPFSHTTPClient;
  private localPinnedCids: Set<string>;
  private publicPinnedCids: Set<string>;
  private machinePinnedCids: Set<string>;
  private userPinnedCids: Set<string>;

  constructor(config: PipeConfig = {}) {
    const localEndpoint = config.localNodeEndpoint || 'http://localhost:5001';
    const publicEndpoint = config.publicNodeEndpoint || 'https://ipfs.infura.io:5001';

    this.localNode = create({ url: localEndpoint });
    this.publicNode = create({ url: publicEndpoint });
    this.isRunning = true;

    console.log('Creating pinned CID sets...');
    this.localPinnedCids = new Set();
    this.publicPinnedCids = new Set();
    this.machinePinnedCids = new Set();
    this.userPinnedCids = new Set();
  }

  private getNodeForScope(scope: Scope): IPFSHTTPClient {
    return scope === 'private' || scope === 'machine' ? this.localNode : this.publicNode;
  }

  async publish(record: PipeRecord): Promise<PipeRecord> {
    if (!this.isRunning) {
      throw new Error('IPFS client is not running');
    }

    const node = this.getNodeForScope(record.scope);
    
    try {
      // Add content to IPFS
      const content = typeof record.content === 'string' 
        ? record.content 
        : JSON.stringify(record.content);
        
      const result = await node.add(content);
      
      return {
        ...record,
        cid: result.path,
      };
    } catch (error) {
      console.error('Error publishing to IPFS:', error);
      throw error;
    }
  }

  async fetch(cid: string, scope: Scope): Promise<PipeRecord | null> {
    if (!this.isRunning) {
      throw new Error('IPFS client is not running');
    }

    const node = this.getNodeForScope(scope);
    
    try {
      const chunks = [];
      for await (const chunk of node.cat(cid)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks).toString();
      
      return {
        cid,
        content: this.tryParseJSON(content),
        type: 'data',
        scope,
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      return null;
    }
  }

  private tryParseJSON(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  async pin(cid: string, scope: Scope): Promise<void> {
    const node = this.getNodeForScope(scope);
    await node.pin.add(cid);
  }

  async unpin(cid: string, scope: Scope): Promise<void> {
    const node = this.getNodeForScope(scope);
    await node.pin.rm(cid);
  }

  async replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void> {
    const content = await this.fetch(cid, fromScope);
    if (!content) {
      throw new Error(`Content not found for CID: ${cid}`);
    }
    await this.publish({
      ...content,
      scope: toScope
    });
  }

  async stop(): Promise<void> {
    if (this.isRunning) {
      try {
        await Promise.all([
          this.localNode.stop(),
          this.publicNode.stop()
        ]);
        this.isRunning = false;
      } catch (error) {
        console.error('Error stopping IPFS client:', error);
        throw error;
      }
    }
  }

  getStatus(): boolean {
    return this.isRunning;
  }

  getNodeInfo(scope: Scope): any {
    const node = this.getNodeForScope(scope);
    return node.id();
  }

  async getStorageMetrics(scope: Scope): Promise<any> {
    const node = this.getNodeForScope(scope);
    const stats = await node.stats.repo();
    return {
      repoSize: stats.repoSize,
      storageMax: stats.storageMax,
      numObjects: stats.numObjects
    };
  }

  async getPinnedCids(scope: Scope): Promise<string[]> {
    const node = this.getNodeForScope(scope);
    const pins = node.pin.ls();
    const cids: string[] = [];
    
    for await (const pin of pins) {
      cids.push(pin.cid.toString());
    }
    
    return cids;
  }

  getConfiguration(scope: Scope): any {
    const node = this.getNodeForScope(scope);
    return {
      endpoint: node.getEndpointConfig(),
      scope
    };
  }
} 
