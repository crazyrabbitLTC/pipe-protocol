import { z } from 'zod';
import { AccessPolicy } from './types';
declare const AccessPolicySchema: z.ZodSchema<AccessPolicy>;
declare const PipeRecordSchema: z.ZodObject<{
    cid: z.ZodOptional<z.ZodString>;
    content: z.ZodAny;
    type: z.ZodEnum<["data", "schema"]>;
    scope: z.ZodEnum<["private", "public", "machine", "user"]>;
    accessPolicy: z.ZodType<AccessPolicy, z.ZodTypeDef, AccessPolicy>;
    encryption: z.ZodObject<{
        enabled: z.ZodBoolean;
        method: z.ZodOptional<z.ZodString>;
        keyRef: z.ZodOptional<z.ZodString>;
        ciphertext: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        method?: string | undefined;
        keyRef?: string | undefined;
        ciphertext?: boolean | undefined;
    }, {
        enabled: boolean;
        method?: string | undefined;
        keyRef?: string | undefined;
        ciphertext?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "data" | "schema";
    scope: "private" | "public" | "machine" | "user";
    accessPolicy: AccessPolicy;
    encryption: {
        enabled: boolean;
        method?: string | undefined;
        keyRef?: string | undefined;
        ciphertext?: boolean | undefined;
    };
    cid?: string | undefined;
    content?: any;
}, {
    type: "data" | "schema";
    scope: "private" | "public" | "machine" | "user";
    accessPolicy: AccessPolicy;
    encryption: {
        enabled: boolean;
        method?: string | undefined;
        keyRef?: string | undefined;
        ciphertext?: boolean | undefined;
    };
    cid?: string | undefined;
    content?: any;
}>;
declare const PipeBundleSchema: z.ZodObject<{
    schemaRecord: z.ZodObject<{
        cid: z.ZodOptional<z.ZodString>;
        content: z.ZodAny;
        type: z.ZodEnum<["data", "schema"]>;
        scope: z.ZodEnum<["private", "public", "machine", "user"]>;
        accessPolicy: z.ZodType<AccessPolicy, z.ZodTypeDef, AccessPolicy>;
        encryption: z.ZodObject<{
            enabled: z.ZodBoolean;
            method: z.ZodOptional<z.ZodString>;
            keyRef: z.ZodOptional<z.ZodString>;
            ciphertext: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        }, {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    }, {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    }>;
    dataRecord: z.ZodObject<{
        cid: z.ZodOptional<z.ZodString>;
        content: z.ZodAny;
        type: z.ZodEnum<["data", "schema"]>;
        scope: z.ZodEnum<["private", "public", "machine", "user"]>;
        accessPolicy: z.ZodType<AccessPolicy, z.ZodTypeDef, AccessPolicy>;
        encryption: z.ZodObject<{
            enabled: z.ZodBoolean;
            method: z.ZodOptional<z.ZodString>;
            keyRef: z.ZodOptional<z.ZodString>;
            ciphertext: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        }, {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    }, {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    }>;
    timestamp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schemaRecord: {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    };
    dataRecord: {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    };
    timestamp?: string | undefined;
}, {
    schemaRecord: {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    };
    dataRecord: {
        type: "data" | "schema";
        scope: "private" | "public" | "machine" | "user";
        accessPolicy: AccessPolicy;
        encryption: {
            enabled: boolean;
            method?: string | undefined;
            keyRef?: string | undefined;
            ciphertext?: boolean | undefined;
        };
        cid?: string | undefined;
        content?: any;
    };
    timestamp?: string | undefined;
}>;
export { AccessPolicySchema, PipeRecordSchema, PipeBundleSchema };
//# sourceMappingURL=schema.d.ts.map