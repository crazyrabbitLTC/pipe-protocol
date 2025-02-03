export interface EncryptionInfo {
  enabled: boolean;
  method?: string;
  keyRef?: string;
  nonce?: string;
  ciphertext?: boolean;
}

export interface AccessPolicy {
  hiddenFromLLM?: boolean;
  allowedTools?: string[];
  allowedUsers?: string[];
}

export type Scope = "private" | "public" | "machine" | "user";

export interface PipeRecord {
  type: "data" | "schema";
  cid?: string;
  content?: any;
  scope: Scope;
  pinned?: boolean;
  encryption?: EncryptionInfo;
  accessPolicy?: AccessPolicy;
  metadata?: Record<string, any>;
}

export interface PipeBundle {
  schemaRecord: PipeRecord;
  dataRecord: PipeRecord;
  combinedScope: Scope;
  timestamp: string;
} 