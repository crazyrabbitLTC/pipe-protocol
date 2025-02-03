import { IpfsClient } from './ipfsClient';
import { EncryptionService } from './encryption';
import { PipeRecord, PipeBundle, Scope } from './types';
import { PipeRecordSchema, PipeBundleSchema } from './schema';

export interface PipeOptions {
  localNodeEndpoint?: string;
  publicNodeEndpoint?: string;
}

export class PipeProtocol {
  private ipfs: IpfsClient;
  private encryption: EncryptionService;

  constructor(options: PipeOptions = {}) {
    this.ipfs = new IpfsClient(options);
    this.encryption = new EncryptionService();
  }

  public async publishRecord(record: PipeRecord): Promise<PipeRecord> {
    const parsedRecord = await PipeRecordSchema.parseAsync(record);
    const validRecord: PipeRecord = {
      ...parsedRecord,
      type: parsedRecord.type,
      scope: parsedRecord.scope,
      cid: parsedRecord.cid || undefined
    };

    if(validRecord.encryption?.enabled && !validRecord.encryption?.ciphertext && validRecord.content) {
      const method = validRecord.encryption?.method || "AES-GCM";
      const keyRef = validRecord.encryption?.keyRef || "defaultKey";

      const plaintext = typeof validRecord.content === 'string'
        ? validRecord.content
        : JSON.stringify(validRecord.content);
      
      const encrypted = this.encryption.encrypt(plaintext, method, keyRef);

      validRecord.content = encrypted;
      validRecord.encryption.ciphertext = true;
    }
    return this.ipfs.publish(validRecord);
  }

  public async publishBundle(bundle: PipeBundle): Promise<PipeBundle> {
    const parsedBundle = await PipeBundleSchema.parseAsync(bundle);
    const validBundle: PipeBundle = {
      ...parsedBundle,
      schemaRecord: {
        ...parsedBundle.schemaRecord,
        type: parsedBundle.schemaRecord.type,
        scope: parsedBundle.schemaRecord.scope,
        cid: parsedBundle.schemaRecord.cid || undefined
      },
      dataRecord: {
        ...parsedBundle.dataRecord,
        type: parsedBundle.dataRecord.type,
        scope: parsedBundle.dataRecord.scope,
        cid: parsedBundle.dataRecord.cid || undefined
      }
    };
    
    const publishedSchema = await this.publishRecord(validBundle.schemaRecord);
    const publishedData = await this.publishRecord(validBundle.dataRecord);

    return {
      ...validBundle,
      schemaRecord: publishedSchema,
      dataRecord: publishedData,
      timestamp: new Date().toISOString(),
    };
  }

  public async fetchRecord(cid: string, scope: Scope): Promise<PipeRecord | null> {
    const content = await this.ipfs.fetch(cid, scope);
    if (!content) return null;

    // If the content is a string and starts with 'encrypted:', it's an encrypted record
    const isEncrypted = typeof content === 'string' && content.startsWith('encrypted:');
    
    // Get encryption info if the content is encrypted
    let encryptionInfo = { enabled: false };
    if (isEncrypted && typeof content === 'string') {
      const info = this.encryption.getEncryptionInfo(content);
      if (info) {
        encryptionInfo = {
          enabled: true,
          method: info.method,
          keyRef: info.keyRef,
          ciphertext: true
        };
      }
    }
    
    return {
      cid,
      content,
      type: 'data',
      scope,
      accessPolicy: { hiddenFromLLM: false },
      encryption: encryptionInfo
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
} 
