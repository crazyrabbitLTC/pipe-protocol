import { createHelia, Helia } from 'helia';
import { PipeRecord, Scope } from './types';
import { config } from 'dotenv';
import { CID } from 'multiformats/cid';
import * as raw from 'multiformats/codecs/raw';
import { sha256 } from 'multiformats/hashes/sha2';
config();

interface PipeIpfsOptions {
  localNodeEndpoint?: string;
  publicNodeEndpoint?: string;
}

export class IpfsClient {
  private localNode!: Helia;
  private publicNode?: Helia;
  private initialized: Promise<void>;

  constructor(options: PipeIpfsOptions = {}) {
    const { localNodeEndpoint, publicNodeEndpoint } = options;
    this.initialized = this.init(localNodeEndpoint, publicNodeEndpoint);
  }

  private async init(localNodeEndpoint?: string, publicNodeEndpoint?: string) {
    try {
      // Initialize with pinning enabled by default
      this.localNode = await createHelia({
        start: true,
        pinning: {
          enable: true
        }
      });
      
      if(publicNodeEndpoint || process.env.PUBLIC_IPFS_ENDPOINT) {
        const publicEndpoint = publicNodeEndpoint || process.env.PUBLIC_IPFS_ENDPOINT || 'https://ipfs.infura.io:5001';
        this.publicNode = await createHelia({
          start: true,
          pinning: {
            enable: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      throw error;
    }
  }

  private async getNode(scope: Scope): Promise<Helia> {
    await this.initialized;
    if(scope === 'public') {
      if(!this.publicNode) {
        throw new Error("Cannot use public scope when no public endpoint is provided");
      }
      return this.publicNode;
    }
    return this.localNode;
  }

  private async createCID(bytes: Uint8Array): Promise<CID> {
    const hash = await sha256.digest(bytes);
    return CID.create(1, raw.code, hash);
  }

  public async publish(record: PipeRecord): Promise<PipeRecord> {
    const node = await this.getNode(record.scope);
    const content = JSON.stringify(record.content);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    const cid = await this.createCID(bytes);
    
    // Store the content
    await node.blockstore.put(cid, bytes);
    
    // Pin if requested
    if (record.pinned) {
      try {
        await this.pin(cid.toString(), record.scope);
      } catch (error) {
        console.warn('Failed to pin content:', error);
        // Continue even if pinning fails
      }
    }
    
    return {...record, cid: cid.toString()};
  }

  public async fetch(cidStr: string, scope: Scope): Promise<any> {
    const node = await this.getNode(scope);
    const cid = CID.parse(cidStr);
    const bytes = await node.blockstore.get(cid);
    const decoder = new TextDecoder();
    const content = decoder.decode(bytes);
    return JSON.parse(content);
  }

  public async pin(cidStr: string, scope: Scope): Promise<void> {
    const node = await this.getNode(scope);
    const cid = CID.parse(cidStr);
    try {
      await node.pins.add(cid);
    } catch (error) {
      console.error('Error pinning content:', error);
      throw error;
    }
  }

  public async unpin(cidStr: string, scope: Scope): Promise<void> {
    const node = await this.getNode(scope);
    const cid = CID.parse(cidStr);
    try {
      await node.pins.rm(cid);
    } catch (error) {
      console.error('Error unpinning content:', error);
      throw error;
    }
  }

  public async replicate(cidStr: string, fromScope: Scope, toScope: Scope): Promise<void> {
    if (toScope === 'public') {
      await this.pin(cidStr, fromScope);
    }
    console.log(`Replication from ${fromScope} to ${toScope} for CID: ${cidStr}`);
  }

  public async stop(): Promise<void> {
    await this.initialized;
    await this.localNode.stop();
    if(this.publicNode) await this.publicNode.stop();
  }

  public async getStatus(): Promise<any> {
    await this.initialized;
    return {
      localNode: Boolean(this.localNode),
      publicNode: Boolean(this.publicNode)
    };
  }

  public async getNodeInfo(scope: Scope): Promise<any> {
    const node = await this.getNode(scope);
    return {
      peerId: node.toString()
    };
  }

  public async getStorageMetrics(scope: Scope): Promise<any> {
    const node = await this.getNode(scope);
    return {
      repoSize: 0 // Simplified metric for now
    };
  }

  public async getPinnedCids(scope: Scope): Promise<string[]> {
    const node = await this.getNode(scope);
    const cidStrings: string[] = [];
    try {
      for await (const { cid } of node.pins.ls()) {
        cidStrings.push(cid.toString());
      }
    } catch (error) {
      console.error('Error listing pinned CIDs:', error);
      throw error;
    }
    return cidStrings;
  }

  public async getConfiguration(scope: Scope): Promise<any> {
    const node = await this.getNode(scope);
    return {
      peerId: node.toString(),
      addrs: []
    };
  }
} 
