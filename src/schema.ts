import { z } from 'zod';
import { AccessPolicy, EncryptionInfo } from './types';

const EncryptionSchema: z.ZodSchema<EncryptionInfo> = z.object({
  enabled: z.boolean(),
  method: z.string().optional(),
  keyRef: z.string().optional(),
  nonce: z.string().optional(),
  ciphertext: z.boolean().optional(),
});

const AccessPolicySchema: z.ZodSchema<AccessPolicy> = z.object({
  hiddenFromLLM: z.boolean().optional(),
  allowedTools: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
});

export const PipeRecordSchema = z.object({
  type: z.enum(['data', 'schema']),
  cid: z.string().nullable().optional(),
  content: z.any().nullable().optional(),
  scope: z.enum(['private', 'public', 'machine', 'user']),
  pinned: z.boolean().optional(),
  encryption: EncryptionSchema.optional(),
  accessPolicy: AccessPolicySchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export const PipeBundleSchema = z.object({
  schemaRecord: PipeRecordSchema,
  dataRecord: PipeRecordSchema,
  combinedScope: z.enum(['private', 'public', 'machine', 'user']),
  timestamp: z.string().datetime(),
}); 