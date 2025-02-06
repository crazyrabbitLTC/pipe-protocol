/**
 * @file Pipe Class Implementation
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-04
 * 
 * Core class for managing tool wrapping and IPFS integration.
 * 
 * IMPORTANT:
 * - All modifications must maintain test coverage
 * - Configuration must be immutable after initialization
 * - Hook system must maintain order of execution
 * - IPFS operations must handle errors gracefully
 * 
 * Functionality:
 * - Tool wrapping with IPFS capabilities
 * - Hook system for extensibility
 * - Configuration management
 * - IPFS client integration
 * - Token counting and limiting
 * - Schema generation
 * - Scope management (public/private)
 * - Pin management
 */

import { Tool } from './types/tool';
import { IPFSClient, IPFSClientConfig } from './services/ipfs/ipfsClient';
import { wrapTool } from './services/pipe/toolWrapping';
import { createPipeTool } from './services/pipe/pipeTool';
import { PipeRecord, Scope, PipeBundle } from './types';
import { generateSummary } from './utils';

export type HookType = 'beforeStore' | 'afterStore';

export interface Hook {
  name: string;
  type: HookType;
  handler: (data: unknown) => unknown | Promise<unknown>;
}

export interface PipeConfig {
  ipfs?: Partial<IPFSClientConfig>;
  defaults?: {
    maxTokens?: number;
    storeResult?: boolean;
    generateSchema?: boolean;
    scope?: 'public' | 'private';
    pin?: boolean;
  };
}

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

export class Pipe {
  private ipfsClient: IPFSClient;
  private hooks: Hook[] = [];
  private config: Required<PipeConfig>;

  constructor(config?: PipeConfig) {
    // Initialize IPFS configuration
    const ipfsConfig: IPFSClientConfig = {
      endpoint: config?.ipfs?.endpoint || 'http://localhost:5001',
      timeout: config?.ipfs?.timeout || 30000,
      scope: config?.ipfs?.scope || 'private',
      pin: config?.ipfs?.pin ?? true
    };

    // Initialize default configuration
    this.config = {
      ipfs: ipfsConfig,
      defaults: {
        maxTokens: config?.defaults?.maxTokens ?? 1000,
        storeResult: config?.defaults?.storeResult ?? true,
        generateSchema: config?.defaults?.generateSchema ?? true,
        scope: config?.defaults?.scope ?? 'private',
        pin: config?.defaults?.pin ?? true
      }
    };

    this.ipfsClient = new IPFSClient(ipfsConfig);
  }

  /**
   * Add hooks to the pipe
   */
  public addHooks(hooks: Hook[]): void {
    this.hooks.push(...hooks);
  }

  /**
   * Remove a hook by name
   */
  public removeHook(name: string): void {
    this.hooks = this.hooks.filter(hook => hook.name !== name);
  }

  /**
   * Execute hooks of a specific type
   */
  private async executeHooks(type: HookType, data: unknown): Promise<unknown> {
    let result = data;
    for (const hook of this.hooks.filter(h => h.type === type)) {
      result = await hook.handler(result);
    }
    return result;
  }

  /**
   * Store data in IPFS
   */
  public async store(data: unknown, options?: { pin?: boolean; scope?: 'public' | 'private' }): Promise<string> {
    const processedData = await this.executeHooks('beforeStore', data);
    const cid = await this.ipfsClient.store(processedData, {
      pin: options?.pin ?? this.config.defaults.pin,
      scope: options?.scope ?? this.config.defaults.scope
    });
    await this.executeHooks('afterStore', { data: processedData, cid });
    return cid;
  }

  /**
   * Retrieve data from IPFS
   */
  public async retrieve(cid: string): Promise<unknown> {
    return this.ipfsClient.fetch(cid, this.config.defaults.scope || 'private');
  }

  /**
   * Wrap tools with IPFS capabilities
   */
  public wrap(tools: Tool[]): Tool[] {
    // Create the pipe tool
    const pipeTool = createPipeTool(this.ipfsClient);
    
    // Wrap the provided tools
    const wrappedTools = tools.map(tool => wrapTool(tool, {
      ipfsClient: this.ipfsClient,
      maxTokens: this.config.defaults.maxTokens,
      storeResult: this.config.defaults.storeResult,
      generateSchema: this.config.defaults.generateSchema,
      scope: this.config.defaults.scope,
      pin: this.config.defaults.pin,
      hooks: {
        beforeStore: (data: unknown) => this.executeHooks('beforeStore', data),
        afterStore: (data: unknown) => this.executeHooks('afterStore', data)
      }
    }));

    // Append the pipe tool at the end
    return [...wrappedTools, pipeTool];
  }

  /**
   * Publish a record to IPFS
   */
  public async publishRecord(record: PipeRecord): Promise<PipeRecord> {
    const processedRecord = await this.executeHooks('beforeStore', record) as PipeRecord;
    const cid = await this.ipfsClient.store(processedRecord, {
      pin: this.config.defaults.pin,
      scope: processedRecord.scope as 'public' | 'private'
    });
    const publishedRecord = { ...processedRecord, cid };
    await this.executeHooks('afterStore', publishedRecord);
    return publishedRecord;
  }

  /**
   * Fetch a record from IPFS
   */
  public async fetchRecord(cid: string, scope: Scope): Promise<PipeRecord | null> {
    const result = await this.ipfsClient.fetch(cid, scope);
    return result as PipeRecord | null;
  }

  /**
   * Pin a record in IPFS
   */
  public async pin(cid: string, scope: Scope): Promise<void> {
    await this.ipfsClient.pin(cid, scope);
  }

  /**
   * Unpin a record from IPFS
   */
  public async unpin(cid: string, scope: Scope): Promise<void> {
    await this.ipfsClient.unpin(cid, scope);
  }

  /**
   * Get pinned CIDs for a scope
   */
  public async getPinnedCids(scope: Scope): Promise<string[]> {
    return this.ipfsClient.getPinnedCids(scope);
  }

  /**
   * Get node status
   */
  public getStatus(): { localNode: boolean; publicNode: boolean } {
    return this.ipfsClient.getStatus();
  }

  /**
   * Get node info for a scope
   */
  public getNodeInfo(scope: Scope): Promise<any> {
    return this.ipfsClient.getNodeInfo(scope);
  }

  /**
   * Get storage metrics for a scope
   */
  public async getStorageMetrics(scope: Scope): Promise<{ totalSize: number; numObjects: number }> {
    return this.ipfsClient.getStorageMetrics(scope);
  }

  /**
   * Publish a bundle to IPFS
   */
  public async publishBundle(bundle: PipeBundle): Promise<PipeBundle> {
    const processedBundle = await this.executeHooks('beforeStore', bundle) as PipeBundle;
    const schemaRecord = await this.publishRecord(processedBundle.schemaRecord);
    const dataRecord = await this.publishRecord(processedBundle.dataRecord);
    const publishedBundle = { ...processedBundle, schemaRecord, dataRecord };
    await this.executeHooks('afterStore', publishedBundle);
    return publishedBundle;
  }

  /**
   * Replicate a record from one scope to another
   */
  public async replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void> {
    await this.ipfsClient.replicate(cid, fromScope, toScope);
  }

  /**
   * Get configuration for a scope
   */
  public async getConfiguration(scope: Scope): Promise<any> {
    return this.ipfsClient.getConfiguration(scope);
  }

  /**
   * Stop the pipe and cleanup resources
   */
  public async stop(): Promise<void> {
    await this.ipfsClient.stop();
  }
}

export { Pipe as PipeProtocol };

/**
 * Example summary hook that generates a summary of data before storage
 */
export const summaryHook: Hook = {
  name: 'summary',
  type: 'beforeStore',
  handler: async (data: unknown) => {
    const summary = await generateSummary(data);
    return {
      data,
      metadata: {
        summary
      }
    };
  }
}; 
