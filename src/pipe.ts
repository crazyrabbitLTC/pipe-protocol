import { IpfsClient } from './ipfsClient';
import { PipeRecord, PipeBundle, Scope, PipeHook, StoreOptions, PipeConfig } from './types';
import { generateSummary } from './utils';

export class PipeProtocol {
  private ipfs: IpfsClient;
  private hooks: PipeHook[] = [];
  private schemaRegistry: Map<string, any> = new Map();
  private currentTool: string | undefined;
  private initialized: Promise<void>;

  constructor(options: PipeConfig = {}) {
    try {
      const ipfsConfig = {
        endpoint: options.ipfsEndpoint,
        options: {}
      };
      
      this.ipfs = new IpfsClient(ipfsConfig);
      this.hooks = options.hooks || [];
      this.initialized = this.init(options.ipfsEndpoint).catch(error => {
        console.error('Error during IPFS initialization:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        throw error;
      });
    } catch (error) {
      console.error('Error during PipeProtocol initialization:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  private async init(endpoint?: string) {
    await this.ipfs.init(endpoint);
  }

  async processHooks(trigger: 'pre-store' | 'post-store', data: any, metadata: Record<string, any>) {
    let processed = data;
    for (const hook of this.hooks) {
      if (hook.trigger === trigger) {
        processed = await hook.handler(processed, metadata);
      }
    }
    return processed;
  }

  addHook(hook: PipeHook) {
    this.hooks.push(hook);
  }

  async storeData(data: any, options: StoreOptions = {}) {
    const generateSchema = options.generateSchema !== false;
    const schema = generateSchema ? this.generateSchema(data) : null;
    
    const [dataCid, schemaCid] = await Promise.all([
      this.ipfs.publish({
        type: 'data',
        content: data,
        scope: options.scope || 'private',
        pinned: options.pin !== false,
        accessPolicy: { hiddenFromLLM: false }
      }),
      schema ? this.ipfs.publish({
        type: 'schema',
        content: schema,
        scope: options.scope || 'private',
        pinned: options.pin !== false,
        accessPolicy: { hiddenFromLLM: false }
      }) : null
    ]);

    return {
      cid: dataCid.cid,
      schemaCid: schemaCid?.cid || undefined,
      timestamp: new Date().toISOString()
    };
  }

  private generateSchema(data: any) {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: Object.keys(data).reduce((acc: Record<string, any>, key) => {
        acc[key] = { type: typeof data[key] };
        return acc;
      }, {})
    };
  }

  public async publishRecord(record: PipeRecord): Promise<PipeRecord> {
    await this.initialized;
    const validRecord = {
      ...record,
      type: record.type,
      scope: record.scope,
      cid: record.cid || undefined
    };
    return this.ipfs.publish(validRecord);
  }

  public async publishBundle(bundle: PipeBundle): Promise<PipeBundle> {
    await this.initialized;
    const validBundle = {
      ...bundle,
      schemaRecord: {
        ...bundle.schemaRecord,
        type: bundle.schemaRecord.type,
        scope: bundle.schemaRecord.scope,
        cid: bundle.schemaRecord.cid || undefined
      },
      dataRecord: {
        ...bundle.dataRecord,
        type: bundle.dataRecord.type,
        scope: bundle.dataRecord.scope,
        cid: bundle.dataRecord.cid || undefined
      }
    };

    const publishedSchema = await this.publishRecord(validBundle.schemaRecord);
    const publishedData = await this.publishRecord(validBundle.dataRecord);

    return {
      ...validBundle,
      schemaRecord: publishedSchema,
      dataRecord: publishedData,
      timestamp: new Date().toISOString()
    };
  }

  public async fetchRecord(cid: string, scope: Scope): Promise<PipeRecord | null> {
    await this.initialized;
    const content = await this.ipfs.fetch(cid, scope);
    if (!content) return null;

    return {
      cid,
      content,
      type: 'data',
      scope,
      accessPolicy: { hiddenFromLLM: false }
    };
  }

  public async pin(cid: string, scope: Scope): Promise<void> {
    return this.ipfs.pin(cid, scope);
  }

  public async unpin(cid: string, scope: Scope): Promise<void> {
    return this.ipfs.unpin(cid, scope);
  }

  public async replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void> {
    return this.ipfs.replicate(cid, fromScope, toScope);
  }

  public async stop() {
    await this.ipfs.stop();
  }

  public getStatus() {
    return this.ipfs.getStatus();
  }

  public getNodeInfo(scope: Scope) {
    return this.ipfs.getNodeInfo(scope);
  }

  public async getStorageMetrics(scope: Scope): Promise<any> {
    return this.ipfs.getStorageMetrics(scope);
  }

  public async getPinnedCids(scope: Scope): Promise<any> {
    return this.ipfs.getPinnedCids(scope);
  }

  public getConfiguration(scope: Scope): any {
    return this.ipfs.getConfiguration(scope);
  }

  wrap(tools: any[]): any[] {
    return tools.map(tool => this.wrapTool(tool));
  }

  private wrapTool(tool: any) {
    return {
      originalTool: tool,
      wrappedDefinition: {
        ...tool,
        parameters: this.enhanceParameters(tool.parameters),
        returns: this.getReturnSchema()
      },
      execute: async (args: any) => {
        this.currentTool = tool.name;
        // Execute original tool
        const result = await tool.call(args);
        
        const metadata = { tool: tool.name, timestamp: new Date().toISOString() };

        // Process hooks
        const processed = await this.processHooks('pre-store', result, metadata);

        // Store in IPFS
        const options = args?.pipeOptions || {};
        const { cid, schemaCid } = await this.storeData(processed, options);
            
        // Post-store hooks
        await this.processHooks('post-store', { cid, data: processed }, metadata);

        return {
          cid,
          schemaCid,
          description: tool.description,
          type: tool.returns?.type || typeof result,
          metadata
        };
      }
    };
  }
    
  private enhanceParameters(originalParams: any) {
    return {
      ...originalParams,
      properties: {
        ...originalParams.properties,
        pipeOptions: {
          type: 'object',
          properties: {
            scope: {
              type: 'string',
              enum: ['private', 'public', 'machine', 'user'],
              default: 'private'
            },
            storeResult: {
              type: 'boolean',
              default: true
            },
            generateSchema: {
              type: 'boolean',
              default: true
            },
            pin: {
              type: 'boolean',
              default: true
            }
          }
        }
      }
    };
  }

  private getReturnSchema() {
    return {
      type: 'object',
      properties: {
        cid: { type: 'string', description: 'IPFS Content Identifier' },
        schemaCid: {
          type: 'string',
          description: 'CID for JSON schema of returned data'
        },
        description: { type: 'string' },
        type: { type: 'string' },
        metadata: { type: 'object' }
      }
    };
  }
}

// Example Summary Hook
export const summaryHook: PipeHook = {
  name: 'data-summarizer',
  trigger: 'pre-store',
  async handler(data: any, metadata: any) {
    const summary = await generateSummary(data);
    return {
      ...data,
      metadata: {
        ...metadata,
        summary
      }
    };
  }
}; 
