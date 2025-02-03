import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { PipeRecord, Scope, PipeIpfsOptions } from './types';
import { config } from 'dotenv';
config();

export class IpfsClient {
  private localNode?: IPFSHTTPClient;
  private publicNode?: IPFSHTTPClient;
  private isRunning: boolean = false;

  constructor(config: PipeIpfsOptions = {}) {
    const { endpoint, options } = config;
    
    if (endpoint) {
      this.localNode = create({ url: endpoint, ...options });
      this.publicNode = create({ url: endpoint, ...options });
    }
  }

  public async init(localNodeEndpoint?: string, publicNodeEndpoint?: string): Promise<void> {
    if (localNodeEndpoint) {
      this.localNode = create({ url: localNodeEndpoint });
    }
    if (publicNodeEndpoint) {
      this.publicNode = create({ url: publicNodeEndpoint });
    }
    this.isRunning = true;

    // Test connections
    try {
      if (!this.localNode || !this.publicNode) {
        throw new Error('IPFS nodes not initialized');
      }
      await Promise.all([
        this.localNode.id(),
        this.publicNode.id()
      ]);
    } catch (error) {
      console.error('Failed to initialize IPFS nodes:', error);
      throw error;
    }
  }

  private getNodeForScope(scope: Scope): IPFSHTTPClient {
    if (!this.isRunning) {
      throw new Error('IPFS client is not running');
    }

    switch (scope) {
      case 'private':
      case 'machine':
        if (!this.localNode) throw new Error('Local node not initialized');
        return this.localNode;
      case 'public':
      case 'user':
        if (!this.publicNode) throw new Error('Public node not initialized');
        return this.publicNode;
      default:
        throw new Error(`Invalid scope: ${scope}`);
    }
  }

  async publish(record: PipeRecord): Promise<PipeRecord> {
    if (!this.isRunning) {
      throw new Error('IPFS client is not running');
    }

    const node = this.getNodeForScope(record.scope);
    
    try {
      // Store the entire record
      const result = await node.add(JSON.stringify(record));
      
      return {
        ...record,
        cid: result.path
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
      
      const rawContent = Buffer.concat(chunks).toString();
      let record: PipeRecord;
      
      try {
        record = JSON.parse(rawContent);
      } catch {
        // If we can't parse the content as a record, assume it's just the content
        record = {
          cid,
          content: rawContent,
          type: 'data',
          scope,
          accessPolicy: { hiddenFromLLM: false },
          encryption: { enabled: false }
        };
      }
      
      return record;
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      return null;
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
        if (this.localNode) await this.localNode.stop();
        if (this.publicNode) await this.publicNode.stop();
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

  async getNodeInfo(scope: Scope): Promise<any> {
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
