import { createHelia, Helia } from 'helia';
import { PipeRecord, Scope } from './types.js';
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
  private localNode!: Helia;
  private publicNode?: Helia;
  private machineNode?: Helia;
  private userNode?: Helia;
  private initialized: Promise<void>;
  private localPinnedCids: Set<string>;
  private publicPinnedCids: Set<string>;
  private machinePinnedCids: Set<string>;
  private userPinnedCids: Set<string>;

  constructor(options: PipeIpfsOptions = {}) {
    console.log('Initializing IpfsClient...');
    try {
      const { localNodeEndpoint, publicNodeEndpoint } = options;
      console.log('Creating pinned CID sets...');
      this.localPinnedCids = new Set();
      this.publicPinnedCids = new Set();
      this.machinePinnedCids = new Set();
      this.userPinnedCids = new Set();
      console.log('Starting IPFS node initialization...');
      this.initialized = this.init(localNodeEndpoint, publicNodeEndpoint).catch(error => {
        console.error('Error during IPFS initialization:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        throw error;
      });
      console.log('IpfsClient constructor complete.');
    } catch (error) {
      console.error('Error in IpfsClient constructor:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  private async init(localNodeEndpoint?: string, publicNodeEndpoint?: string) {
    try {
      console.log('Creating local IPFS node...');
      // Initialize with memory blockstore for testing
      const blockstore = new MemoryBlockstore();
      
      this.localNode = await createHelia({
        blockstore,
        start: true
      });
      console.log('Local IPFS node created successfully.');
      
      if(publicNodeEndpoint || process.env.PUBLIC_IPFS_ENDPOINT) {
        console.log('Creating public IPFS node...');
        const publicEndpoint = publicNodeEndpoint || process.env.PUBLIC_IPFS_ENDPOINT || 'https://ipfs.infura.io:5001';
        const publicBlockstore = new MemoryBlockstore();
        this.publicNode = await createHelia({
          blockstore: publicBlockstore,
          start: true
        });
        console.log('Public IPFS node created successfully.');
      }

      // Create machine and user nodes with separate blockstores
      console.log('Creating machine IPFS node...');
      const machineBlockstore = new MemoryBlockstore();
      this.machineNode = await createHelia({
        blockstore: machineBlockstore,
        start: true
      });
      console.log('Machine IPFS node created successfully.');

      console.log('Creating user IPFS node...');
      const userBlockstore = new MemoryBlockstore();
      this.userNode = await createHelia({
        blockstore: userBlockstore,
        start: true
      });
      console.log('User IPFS node created successfully.');
    } catch (error) {
      console.error('Failed to initialize IPFS client:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  private async getNode(scope: Scope): Promise<{ node: Helia; pinnedCids: Set<string> }> {
    await this.initialized;
    switch (scope) {
      case 'public':
        if (!this.publicNode) {
          throw new Error("Cannot use public scope when no public endpoint is provided");
        }
        return { node: this.publicNode, pinnedCids: this.publicPinnedCids };
      case 'machine':
        if (!this.machineNode) {
          throw new Error("Machine node not initialized");
        }
        return { node: this.machineNode, pinnedCids: this.machinePinnedCids };
      case 'user':
        if (!this.userNode) {
          throw new Error("User node not initialized");
        }
        return { node: this.userNode, pinnedCids: this.userPinnedCids };
      case 'private':
        if (!this.localNode) {
          throw new Error("Local node not initialized");
        }
        return { node: this.localNode, pinnedCids: this.localPinnedCids };
      default:
        throw new Error(`Invalid scope: ${scope}`);
    }
  }

  private async createCID(bytes: Uint8Array): Promise<CID> {
    const hash = await sha256.digest(bytes);
    return CID.create(1, raw.code, hash);
  }

  public async publish(record: PipeRecord): Promise<PipeRecord> {
    const { node } = await this.getNode(record.scope);
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
    const { node, pinnedCids } = await this.getNode(scope);
    
    try {
      const cid = CID.parse(cidStr);
      
      // Check if the CID is pinned in this scope
      if (!pinnedCids.has(cidStr)) {
        throw new Error(`Content with CID ${cidStr} is not available in ${scope} scope`);
      }

      const bytes = await node.blockstore.get(cid);
      const decoder = new TextDecoder();
      const content = decoder.decode(bytes);
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('is not available')) {
          throw error;
        }
        throw new Error(`Failed to fetch content: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching content');
    }
  }

  public async pin(cidStr: string, scope: Scope): Promise<void> {
    const { node, pinnedCids } = await this.getNode(scope);
    const cid = CID.parse(cidStr);
    try {
      // Verify the content exists before pinning
      await node.blockstore.get(cid);
      pinnedCids.add(cidStr);
    } catch (error) {
      console.error('Error pinning content:', error);
      throw error;
    }
  }

  public async unpin(cidStr: string, scope: Scope): Promise<void> {
    const { pinnedCids } = await this.getNode(scope);
    pinnedCids.delete(cidStr);
  }

  public async replicate(cidStr: string, fromScope: Scope, toScope: Scope): Promise<void> {
    console.log(`Starting replication from ${fromScope} to ${toScope} for CID: ${cidStr}`);
    
    try {
      // Validate scopes
      if (!['private', 'public', 'machine', 'user'].includes(fromScope)) {
        throw new Error(`Invalid source scope: ${fromScope}`);
      }
      if (!['private', 'public', 'machine', 'user'].includes(toScope)) {
        throw new Error(`Invalid target scope: ${toScope}`);
      }

      // Get source and target nodes
      const { node: sourceNode, pinnedCids: sourcePinnedCids } = await this.getNode(fromScope);
      const { node: targetNode } = await this.getNode(toScope);

      // Check if the content exists in the source scope
      if (!sourcePinnedCids.has(cidStr)) {
        throw new Error('Content not found in source scope');
      }

      // Get the content from source
      const cid = CID.parse(cidStr);
      let bytes: Uint8Array | undefined;
      try {
        bytes = await sourceNode.blockstore.get(cid);
      } catch (error) {
        throw new Error('Content not found in source scope');
      }

      if (!bytes || bytes.length === 0) {
        throw new Error('Content not found in source scope');
      }

      // Store in target
      await targetNode.blockstore.put(cid, bytes);

      // Pin in target scope
      await this.pin(cidStr, toScope);

      console.log(`Successfully replicated CID ${cidStr} from ${fromScope} to ${toScope}`);
    } catch (error) {
      console.error(`Error during replication:`, error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error instanceof Error ? error : new Error('Unknown error during replication');
    }
  }

  public async stop(): Promise<void> {
    await this.initialized;
    await this.localNode.stop();
    if(this.publicNode) await this.publicNode.stop();
    if(this.machineNode) await this.machineNode.stop();
    if(this.userNode) await this.userNode.stop();
  }

  public async getStatus(): Promise<any> {
    await this.initialized;
    return {
      localNode: Boolean(this.localNode),
      publicNode: Boolean(this.publicNode),
      machineNode: Boolean(this.machineNode),
      userNode: Boolean(this.userNode)
    };
  }

  public async getNodeInfo(scope: Scope): Promise<any> {
    const { node } = await this.getNode(scope);
    return {
      peerId: node.toString()
    };
  }

  public async getStorageMetrics(scope: Scope): Promise<any> {
    const { node, pinnedCids } = await this.getNode(scope);
    return {
      repoSize: 0, // Blockstore size not directly accessible
      blockCount: 0, // Block count not directly accessible
      pinnedCount: pinnedCids.size
    };
  }

  public async getPinnedCids(scope: Scope): Promise<string[]> {
    const { pinnedCids } = await this.getNode(scope);
    return Array.from(pinnedCids);
  }

  public async getConfiguration(scope: Scope): Promise<any> {
    const { node } = await this.getNode(scope);
    return {
      peerId: node.toString(),
      addrs: []
    };
  }
} 
