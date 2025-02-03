"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipeBundleSchema = exports.PipeRecordSchema = exports.AccessPolicySchema = void 0;
const zod_1 = require("zod");
const EncryptionSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    method: zod_1.z.string().optional(),
    keyRef: zod_1.z.string().optional(),
    nonce: zod_1.z.string().optional(),
    ciphertext: zod_1.z.boolean().optional(),
});
const AccessPolicySchema = zod_1.z.object({
    hiddenFromLLM: zod_1.z.boolean(),
    allowedTools: zod_1.z.array(zod_1.z.string()).optional(),
    allowedUsers: zod_1.z.array(zod_1.z.string()).optional()
});
exports.AccessPolicySchema = AccessPolicySchema;
const PipeRecordSchema = zod_1.z.object({
    cid: zod_1.z.string().optional(),
    content: zod_1.z.any(),
    type: zod_1.z.enum(['data', 'schema']),
    scope: zod_1.z.enum(['private', 'public', 'machine', 'user']),
    accessPolicy: AccessPolicySchema,
    encryption: zod_1.z.object({
        enabled: zod_1.z.boolean(),
        method: zod_1.z.string().optional(),
        keyRef: zod_1.z.string().optional(),
        ciphertext: zod_1.z.boolean().optional()
    })
});
exports.PipeRecordSchema = PipeRecordSchema;
const PipeBundleSchema = zod_1.z.object({
    schemaRecord: PipeRecordSchema,
    dataRecord: PipeRecordSchema,
    timestamp: zod_1.z.string().optional()
});
exports.PipeBundleSchema = PipeBundleSchema;
//# sourceMappingURL=schema.js.map