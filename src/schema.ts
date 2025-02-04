import { z } from 'zod';
import { AccessPolicy, PipeRecord, PipeBundle } from './types';

const AccessPolicySchema: z.ZodSchema<AccessPolicy> = z.object({
  hiddenFromLLM: z.boolean().optional(),
  allowedTools: z.array(z.string()).optional(),
  allowedUsers: z.array(z.string()).optional(),
});

export const PipeRecordSchema = z.object({
  cid: z.string().nullable().optional(),
  content: z.any().nullable().optional(),
  type: z.enum(['data', 'schema']),
  scope: z.enum(['private', 'public', 'machine', 'user']),
  pinned: z.boolean().optional(),
  accessPolicy: AccessPolicySchema.optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

export const PipeBundleSchema = z.object({
  schemaRecord: PipeRecordSchema,
  dataRecord: PipeRecordSchema,
  combinedScope: z.enum(['private', 'public', 'machine', 'user']),
  timestamp: z.string().optional()
}); 