/**
 * @file Pipe Class Implementation
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-04
 * 
 * Core class for managing tool wrapping and IPFS integration
 * 
 * Functionality:
 * - Tool wrapping with IPFS capabilities
 * - Hook system for extensibility
 * - Configuration management
 * - IPFS client integration
 */

import { Tool } from './types/tool';
import { IPFSClient, IPFSClientConfig } from './services/ipfs/ipfsClient';
import { wrapTool } from './services/pipe/toolWrapping';

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
    return this.ipfsClient.fetch(cid);
  }

  /**
   * Wrap tools with IPFS capabilities
   */
  public wrap(tools: Tool[]): Tool[] {
    return tools.map(tool => wrapTool(tool, {
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
  }
} 
