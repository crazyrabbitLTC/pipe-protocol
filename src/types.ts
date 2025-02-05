export interface AccessPolicy {
  hiddenFromLLM?: boolean;
  allowedTools?: string[];
  allowedUsers?: string[];
}

export type Scope = 'private' | 'public' | 'machine' | 'user';

export interface PipeRecord {
  type: 'data' | 'schema';
  cid?: string;
  content?: any;
  scope: Scope;
  pinned?: boolean;
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
  hooks?: PipeHook[];
  storage?: 'memory' | 'persistent';
  storageConfig?: {
    directory?: string;
  };
  enableNetworking?: boolean;
  listenAddresses?: string[];
  bootstrapList?: string[];
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
     parameters: {
         type: 'object';
         properties: Record<string, any>;
         required?: string[];
     };
     returns?: {
         type: string;
        description?: string;
    };
    call: (...args: any[]) => any;
}

export interface PipeTool {
    name: string;
    description: string;
    call: (method: string, args: any) => Promise<PipeRecord | PipeBundle | null | void>;
}

export interface PipeIpfsOptions {
    endpoint?: string;
    options?: Record<string, any>
}

export interface IpfsNodeConfig {
    endpoint?: string
    options?: Record<string, any>
} 