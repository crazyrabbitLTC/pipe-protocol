export type Scope = 'private' | 'public' | 'machine' | 'user';

export interface EncryptionInfo {
  enabled: boolean;
  method?: string;
  keyRef?: string;
  ciphertext?: boolean;
}

export interface AccessPolicy {
  hiddenFromLLM: boolean;
  allowedTools?: string[];
}

export interface PipeRecord {
  type: 'data' | 'schema';
  content: any;
  scope: Scope;
  cid?: string;
  pinned?: boolean;
  encryption?: EncryptionInfo;
  accessPolicy?: AccessPolicy;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface PipeBundle {
  schemaRecord: PipeRecord;
  dataRecord: PipeRecord;
  combinedScope: Scope;
  timestamp?: string;
}

export interface PipeConfig {
  ipfsEndpoint?: string;
  defaultScope?: Scope;
  autoPin?: boolean;
  hooks?: PipeHook[];
}

export interface PipeHook {
  name: string;
  handler: (data: any, metadata: Record<string, any>) => Promise<any>;
  trigger: 'pre-store' | 'post-store';
}

export interface StoreOptions {
  scope?: Scope;
  pin?: boolean;
  generateSchema?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  call: (...args: any[]) => any;
  parameters?: any;
  returns?: any;
}

export interface PipeTool {
  name: string;
  description: string;
  call: (method: string, args: any) => Promise<PipeRecord | PipeBundle | null | void>;
} 