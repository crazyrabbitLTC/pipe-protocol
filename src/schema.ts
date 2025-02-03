import { z } from 'zod';
import { AccessPolicy, EncryptionInfo, PipeRecord, PipeBundle } from './types';

const EncryptionSchema: z.ZodSchema<EncryptionInfo> = z.object({
  enabled: z.boolean(),
  method: z.string().optional(),
  keyRef: z.string().optional(),
  nonce: z.string().optional(),
  ciphertext: z.boolean().optional(),
});

const AccessPolicySchema: z.ZodSchema<AccessPolicy> = z.object({
  hiddenFromLLM: z.boolean(),
  allowedTools: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional()
});

const PipeRecordSchema = z.object({
  cid: z.string().optional(),
  content: z.any(),
  type: z.enum(['data', 'schema']),
  scope: z.enum(['private', 'public', 'machine', 'user']),
  accessPolicy: AccessPolicySchema,
  encryption: z.object({
    enabled: z.boolean(),
    method: z.string().optional(),
    keyRef: z.string().optional(),
    ciphertext: z.boolean().optional()
  })
});

const PipeBundleSchema = z.object({
  schemaRecord: PipeRecordSchema,
  dataRecord: PipeRecordSchema,
  timestamp: z.string().optional()
});

export { AccessPolicySchema, PipeRecordSchema, PipeBundleSchema }; 