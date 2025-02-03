import { IpfsClient } from './ipfsClient';
import { EncryptionService } from './encryption';
import { 
  PipeRecord, 
  PipeBundle, 
  Scope, 
  PipeConfig, 
  PipeHook, 
  StoreOptions,
  Tool 
} from './types';
import { generateSummary, generateTimestamp, deepClone } from './utils';

export class PipeProtocol {
  private ipfs: IpfsClient;
  private encryption: EncryptionService;
  private hooks: PipeHook[] = [];
  private currentTool: string | undefined;

  constructor(options: PipeConfig = {}) {
    console.log('Initializing PipeProtocol...');
    try {
      console.log('Creating EncryptionService...');
      this.encryption = new EncryptionService();
      console.log('Creating IpfsClient...');
      this.ipfs = new IpfsClient(options);
      this.hooks = options.hooks || [];
      console.log('PipeProtocol initialization complete.');
    } catch (error) {
      console.error('Error during PipeProtocol initialization:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
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
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      }),
      schema ? this.ipfs.publish({
        type: 'schema',
        content: schema,
        scope: options.scope || 'private',
        pinned: options.pin !== false,
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      }) : null
    ]);

    return {
      cid: dataCid.cid,
      schemaCid: schemaCid?.cid,
      timestamp: generateTimestamp()
    };
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
    const validRecord = deepClone(record);

    if (validRecord.encryption?.enabled && !validRecord.encryption?.ciphertext && validRecord.content) {
      const method = validRecord.encryption?.method || "AES-GCM";
      const keyRef = validRecord.encryption?.keyRef || "defaultKey";

      const plaintext = typeof validRecord.content === 'string'
        ? validRecord.content
        : JSON.stringify(validRecord.content);
      
      const encrypted = await this.encryption.encrypt(plaintext, method, keyRef);
      validRecord.content = encrypted;
      validRecord.encryption.ciphertext = true;
    }

    return this.ipfs.publish(validRecord);
  }

  public async publishBundle(bundle: PipeBundle): Promise<PipeBundle> {
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
    const record = await this.ipfs.fetch(cid, scope);
    if (!record) return null;

    if (record.encryption?.enabled && record.encryption?.ciphertext) {
      const decrypted = await this.encryption.decrypt(
        record.content,
        record.encryption.method || "AES-GCM",
        record.encryption.keyRef || "defaultKey"
      );
      record.content = decrypted;
      record.encryption.ciphertext = false;
    }

    return record;
  }

  // IPFS Node Management Methods
  public async stop() {
    await this.ipfs.stop();
  }

  public getStatus() {
    return this.ipfs.getStatus();
  }

  public getNodeInfo(scope: Scope) {
    return this.ipfs.getNodeInfo(scope);
  }

  public getStorageMetrics(scope: Scope) {
    return this.ipfs.getStorageMetrics(scope);
  }

  public getPinnedCids(scope: Scope) {
    return this.ipfs.getPinnedCids(scope);
  }

  public getConfiguration(scope: Scope) {
    return this.ipfs.getConfiguration(scope);
  }

  // Pin Management Methods
  public async pin(cid: string, scope: Scope): Promise<void> {
    return this.ipfs.pin(cid, scope);
  }

  public async unpin(cid: string, scope: Scope): Promise<void> {
    return this.ipfs.unpin(cid, scope);
  }

  public async replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void> {
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
        returns: this.getReturnSchema(tool)
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

  private getReturnSchema(tool: Tool) {
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
