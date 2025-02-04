import { create } from 'ipfs-http-client';
import { PipeRecord, Scope, PipeIpfsOptions } from './types';
import { PipeRecordSchema } from './schema';
import { config } from 'dotenv';
config();

export class IpfsClient {
  private localNode: any;
  private options: PipeIpfsOptions;

  constructor(options: PipeIpfsOptions) {
    this.options = options;
  }

  async init(endpoint?: string) {
    try {
      this.localNode = create({ url: endpoint || this.options.endpoint });
      await this.localNode.version();
    } catch (error) {
      console.error('Error initializing IPFS node:', error);
      throw error;
    }
  }

  async publish(record: PipeRecord): Promise<PipeRecord> {
    try {
      const validatedRecord = PipeRecordSchema.parse(record);
      const { cid } = await this.localNode.add(JSON.stringify(validatedRecord));
      
      if (validatedRecord.pinned) {
        await this.pin(cid.toString(), validatedRecord.scope);
      }

      return {
        ...validatedRecord,
        cid: cid.toString()
      };
    } catch (error) {
      console.error('Error publishing record:', error);
      throw error;
    }
  }

  async fetch(cid: string, scope: Scope): Promise<any> {
    try {
      const chunks = [];
      for await (const chunk of this.localNode.cat(cid)) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString();
      return JSON.parse(content);
    } catch (error) {
      console.error('Error fetching record:', error);
      throw error;
    }
  }

  async pin(cid: string, scope: Scope): Promise<void> {
    try {
      await this.localNode.pin.add(cid);
    } catch (error) {
      console.error('Error pinning record:', error);
      throw error;
    }
  }

  async unpin(cid: string, scope: Scope): Promise<void> {
    try {
      await this.localNode.pin.rm(cid);
    } catch (error) {
      console.error('Error unpinning record:', error);
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
    // No cleanup needed for HTTP client
  }

  getStatus() {
    return {
      localNode: true,
      publicNode: false
    };
  }

  getNodeInfo(scope: Scope) {
    return {
      peerId: 'local'
    };
  }

  async getStorageMetrics(scope: Scope) {
    try {
      const stats = await this.localNode.stats.repo();
      return {
        repoSize: stats.repoSize,
        blockCount: stats.numObjects,
        pinnedCount: 0
      };
    } catch (error) {
      console.error('Error getting storage metrics:', error);
      throw error;
    }
  }

  async getPinnedCids(scope: Scope): Promise<string[]> {
    try {
      const pins = [];
      for await (const pin of this.localNode.pin.ls()) {
        pins.push(pin.cid.toString());
      }
      return pins;
    } catch (error) {
      console.error('Error getting pinned CIDs:', error);
      throw error;
    }
  }

  getConfiguration(scope: Scope) {
    return {
      peerId: 'local',
      addrs: []
    };
  }
} 

