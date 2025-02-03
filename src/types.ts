export interface EncryptionInfo {
  enabled: boolean;
  method?: string;
  keyRef?: string;
  nonce?: string;
  ciphertext?: boolean;
  contentType?: 'string' | 'json';
}

export interface AccessPolicy {
  hiddenFromLLM: boolean;
  allowedTools?: string[];
  allowedUsers?: string[];
}

export type Scope = 'private' | 'public' | 'machine' | 'user';

export interface PipeRecord {
  cid?: string;
  content: any;
  type: 'data' | 'schema';
  scope: Scope;
  accessPolicy: AccessPolicy;
  encryption: EncryptionInfo;
}

export interface PipeBundle {
  schemaRecord: PipeRecord;
  dataRecord: PipeRecord;
  timestamp?: string;
}

export interface PipeOptions {
  localNodeEndpoint?: string;
  publicNodeEndpoint?: string;
  hooks?: PipeHook[];
}

export interface PipeIpfsOptions {
  endpoint?: string;
  options?: Record<string, any>;
  localNodeEndpoint?: string;
  publicNodeEndpoint?: string;
}

export interface PipeHook {
  name: string;
  trigger: 'pre-store' | 'post-store';
  handler: (data: any, metadata: Record<string, any>) => Promise<any>;
}

export interface StoreOptions {
  scope?: Scope;
  generateSchema?: boolean;
  pin?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  returns?: {
    type: string;
    description?: string;
  };
  call: (args: any) => Promise<any>;
}

export interface IpfsNodeConfig {
  endpoint?: string;
  options?: Record<string, any>;
} 