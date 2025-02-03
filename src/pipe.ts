import { IpfsClient } from './ipfsClient';
import { EncryptionService } from './encryption';
import { 
  PipeRecord, 
  PipeBundle, 
  Scope, 
  PipeHook,
  StoreOptions,
  Tool,
  PipeOptions,
  PipeIpfsOptions
} from './types';
import { generateSummary, generateTimestamp, deepClone } from './utils';

export class PipeProtocol {
  private ipfs: IpfsClient;
  private encryption: EncryptionService;
  private hooks: PipeHook[] = [];
  private currentTool: string | undefined;
  private initialized: Promise<void>;

  constructor(options: PipeOptions = {}) {
    console.log('Initializing PipeProtocol...');
    try {
      console.log('Creating EncryptionService...');
      this.encryption = new EncryptionService();
      console.log('Creating IpfsClient...');
      
      // Map PipeOptions to PipeIpfsOptions
      const ipfsConfig: PipeIpfsOptions = {
        endpoint: options.localNodeEndpoint,
        options: {}
      };
      
      this.ipfs = new IpfsClient(ipfsConfig);
      this.hooks = options.hooks || [];
      this.initialized = this.init(options.localNodeEndpoint, options.publicNodeEndpoint).catch(error => {
        console.error('Error during IPFS initialization:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        throw error;
      });
      console.log('PipeProtocol initialization complete.');
    } catch (error) {
      console.error('Error during PipeProtocol initialization:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  private async init(localNodeEndpoint?: string, publicNodeEndpoint?: string) {
    await this.ipfs.init(localNodeEndpoint, publicNodeEndpoint);
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
    await this.initialized;
    const generateSchema = options.generateSchema !== false;
    const schema = generateSchema ? this.generateSchema(data) : null;

    // Process pre-store hooks
    const processedData = await this.processHooks('pre-store', data, {
      tool: this.currentTool,
      timestamp: generateTimestamp()
    });

    const [dataCid, schemaCid] = await Promise.all([
      this.publishRecord({
        type: 'data',
        content: processedData,
        scope: options.scope || 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      }),
      schema ? this.publishRecord({
        type: 'schema',
        content: schema,
        scope: options.scope || 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      }) : Promise.resolve(null)
    ]);

    const result = {
      cid: dataCid.cid!,
      schemaCid: schemaCid ? schemaCid.cid : null,
      timestamp: generateTimestamp()
    };

    // Process post-store hooks
    await this.processHooks('post-store', result, {
      tool: this.currentTool,
      timestamp: generateTimestamp()
    });

    return result;
  }

  private generateSchema(data: any) {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: Object.keys(data).reduce((acc, key) => {
        acc[key] = { type: typeof data[key] };
        return acc;
      }, {} as Record<string, any>)
    };
  }

  public async publishRecord(record: PipeRecord): Promise<PipeRecord> {
    await this.initialized;
    const validRecord = deepClone(record);

    if (validRecord.encryption?.enabled && !validRecord.encryption?.ciphertext && validRecord.content) {
      const method = validRecord.encryption?.method || 'AES-GCM';
      const keyRef = validRecord.encryption?.keyRef || 'defaultKey';
      const isJson = typeof validRecord.content !== 'string';

      // Always stringify content for encryption
      const plaintext = isJson ? JSON.stringify(validRecord.content) : validRecord.content;
        
      const encrypted = await this.encryption.encrypt(plaintext, method, keyRef, process.env.NODE_ENV === 'test');
      
      // Create a new record with encrypted content and updated encryption info
      const encryptedRecord = {
        ...validRecord,
        content: encrypted,
        encryption: {
          ...validRecord.encryption,
          enabled: true,
          ciphertext: true,
          method,
          keyRef,
          contentType: isJson ? 'json' as const : 'string' as const
        }
      };

      return this.ipfs.publish(encryptedRecord);
    }

    return this.ipfs.publish(validRecord);
  }

  public async publishBundle(bundle: PipeBundle): Promise<PipeBundle> {
    await this.initialized;
    const validBundle = deepClone(bundle);
    
    const publishedSchema = await this.publishRecord(validBundle.schemaRecord);
    const publishedData = await this.publishRecord(validBundle.dataRecord);

    return {
      ...validBundle,
      schemaRecord: publishedSchema,
      dataRecord: publishedData,
      timestamp: generateTimestamp()
    };
  }

  public async fetchRecord(cid: string, scope: Scope): Promise<PipeRecord | null> {
    await this.initialized;
    const record = await this.ipfs.fetch(cid, scope);
    if (!record) return null;

    if (record.encryption?.enabled && record.encryption?.ciphertext) {
      const decrypted = await this.encryption.decrypt(
        record.content,
        record.encryption.method || 'AES-GCM',
        record.encryption.keyRef || 'defaultKey',
        process.env.NODE_ENV === 'test'
      );
      
      // Parse content based on the original content type
      if (record.encryption.contentType === 'json') {
        try {
          record.content = JSON.parse(decrypted);
        } catch (error) {
          console.error('Failed to parse decrypted JSON:', error);
          throw new Error('Failed to parse decrypted content as JSON');
        }
      } else {
        record.content = decrypted;
      }
      
      record.encryption = {
        ...record.encryption,
        enabled: true,
        ciphertext: false
      };
    } else if (typeof record.content === 'string' && !record.encryption?.contentType) {
      // Only try to parse non-encrypted content as JSON if it's not explicitly marked as a string
      try {
        record.content = JSON.parse(record.content);
      } catch {
        // Keep content as is if it's not valid JSON
      }
    }

    return record;
  }

  // IPFS Node Management Methods
  public async stop() {
    await this.initialized;
    await this.ipfs.stop();
  }

  public async getStatus() {
    await this.initialized;
    return this.ipfs.getStatus();
  }

  public async getNodeInfo(scope: Scope) {
    await this.initialized;
    return this.ipfs.getNodeInfo(scope);
  }

  public async getStorageMetrics(scope: Scope) {
    await this.initialized;
    return this.ipfs.getStorageMetrics(scope);
  }

  public async getPinnedCids(scope: Scope) {
    await this.initialized;
    return this.ipfs.getPinnedCids(scope);
  }

  public async getConfiguration(scope: Scope) {
    await this.initialized;
    return this.ipfs.getConfiguration(scope);
  }

  // Pin Management Methods
  public async pin(cid: string, scope: Scope): Promise<void> {
    await this.initialized;
    return this.ipfs.pin(cid, scope);
  }

  public async unpin(cid: string, scope: Scope): Promise<void> {
    await this.initialized;
    return this.ipfs.unpin(cid, scope);
  }

  public async replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void> {
    await this.initialized;
    return this.ipfs.replicate(cid, fromScope, toScope);
  }

  // Tool Wrapping Methods
  wrap(tools: Tool[]): any[] {
    return tools.map(tool => this.wrapTool(tool));
  }

  private wrapTool(tool: Tool) {
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

        // Process hooks
        const metadata = { tool: tool.name, timestamp: generateTimestamp() };
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

  private getReturnSchema(): any {
    return {
      type: 'object',
      properties: {
        cid: { type: 'string', description: 'IPFS Content Identifier' },
        schemaCid: { type: 'string', description: 'CID for JSON schema of returned data' },
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
