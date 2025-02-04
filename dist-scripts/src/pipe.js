"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryHook = exports.PipeProtocol = void 0;
const ipfsClient_1 = require("./ipfsClient");
const encryption_1 = require("./encryption");
const utils_1 = require("./utils");
class PipeProtocol {
    constructor(options = {}) {
        this.hooks = [];
        try {
            this.encryption = new encryption_1.EncryptionService();
            // Map PipeOptions to PipeIpfsOptions
            const ipfsConfig = {
                endpoint: options.localNodeEndpoint,
                options: {}
            };
            this.ipfs = new ipfsClient_1.IpfsClient(ipfsConfig);
            this.hooks = options.hooks || [];
            this.initialized = this.init(options.localNodeEndpoint, options.publicNodeEndpoint).catch(error => {
                console.error('Error during IPFS initialization:', error);
                if (error instanceof Error) {
                    console.error('Error stack:', error.stack);
                }
                throw error;
            });
        }
        catch (error) {
            console.error('Error during PipeProtocol initialization:', error);
            if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
    }
    async init(localNodeEndpoint, publicNodeEndpoint) {
        await this.ipfs.init(localNodeEndpoint, publicNodeEndpoint);
    }
    async processHooks(trigger, data, metadata) {
        let processed = data;
        for (const hook of this.hooks) {
            if (hook.trigger === trigger) {
                processed = await hook.handler(processed, metadata);
            }
        }
        return processed;
    }
    addHook(hook) {
        this.hooks.push(hook);
    }
    async storeData(data, options = {}) {
        await this.initialized;
        const generateSchema = options.generateSchema !== false;
        const schema = generateSchema ? this.generateSchema(data) : null;
        // Process pre-store hooks
        const processedData = await this.processHooks('pre-store', data, {
            tool: this.currentTool,
            timestamp: (0, utils_1.generateTimestamp)()
        });
        const [dataCid, schemaCid] = await Promise.all([
            this.publishRecord({
                type: 'data',
                content: processedData,
                scope: options.scope || 'private',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            }),
            schema ? this.publishRecord({
                type: 'schema',
                content: schema,
                scope: options.scope || 'private',
                accessPolicy: { hiddenFromLLM: false },
                encryption: { enabled: false }
            }) : Promise.resolve(null)
        ]);
        const result = {
            cid: dataCid.cid,
            schemaCid: schemaCid ? schemaCid.cid : null,
            timestamp: (0, utils_1.generateTimestamp)()
        };
        // Process post-store hooks
        await this.processHooks('post-store', result, {
            tool: this.currentTool,
            timestamp: (0, utils_1.generateTimestamp)()
        });
        return result;
    }
    generateSchema(data) {
        return {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            properties: Object.keys(data).reduce((acc, key) => {
                acc[key] = { type: typeof data[key] };
                return acc;
            }, {})
        };
    }
    async publishRecord(record) {
        await this.initialized;
        const validRecord = (0, utils_1.deepClone)(record);
        if (validRecord.encryption?.enabled && !validRecord.encryption?.ciphertext && validRecord.content) {
            const method = validRecord.encryption?.method || 'AES-GCM';
            const keyRef = validRecord.encryption?.keyRef || 'defaultKey';
            const isJson = typeof validRecord.content !== 'string';
            // Always stringify content for encryption
            const plaintext = isJson ? JSON.stringify(validRecord.content) : validRecord.content;
            const encrypted = await this.encryption.encrypt(plaintext, method, keyRef, process.env.NODE_ENV === 'test');
            // Create a new record with encrypted content and updated encryption info
            const encryptedRecord = {
                ...validRecord,
                content: encrypted,
                encryption: {
                    ...validRecord.encryption,
                    enabled: true,
                    ciphertext: true,
                    method,
                    keyRef,
                    contentType: isJson ? 'json' : 'string'
                }
            };
            return this.ipfs.publish(encryptedRecord);
        }
        return this.ipfs.publish(validRecord);
    }
    async publishBundle(bundle) {
        await this.initialized;
        const validBundle = (0, utils_1.deepClone)(bundle);
        const publishedSchema = await this.publishRecord(validBundle.schemaRecord);
        const publishedData = await this.publishRecord(validBundle.dataRecord);
        return {
            ...validBundle,
            schemaRecord: publishedSchema,
            dataRecord: publishedData,
            timestamp: (0, utils_1.generateTimestamp)()
        };
    }
    async fetchRecord(cid, scope) {
        await this.initialized;
        const record = await this.ipfs.fetch(cid, scope);
        if (!record)
            return null;
        if (record.encryption?.enabled && record.encryption?.ciphertext) {
            const decrypted = await this.encryption.decrypt(record.content, record.encryption.method || 'AES-GCM', record.encryption.keyRef || 'defaultKey', process.env.NODE_ENV === 'test');
            // Parse content based on the original content type
            if (record.encryption.contentType === 'json') {
                try {
                    record.content = JSON.parse(decrypted);
                }
                catch (error) {
                    console.error('Failed to parse decrypted JSON:', error);
                    throw new Error('Failed to parse decrypted content as JSON');
                }
            }
            else {
                record.content = decrypted;
            }
            record.encryption = {
                ...record.encryption,
                enabled: true,
                ciphertext: false
            };
        }
        else if (typeof record.content === 'string' && !record.encryption?.contentType) {
            // Only try to parse non-encrypted content as JSON if it's not explicitly marked as a string
            try {
                record.content = JSON.parse(record.content);
            }
            catch {
                // Keep content as is if it's not valid JSON
            }
        }
        return record;
    }
    // IPFS Node Management Methods
    async stop() {
        await this.initialized;
        await this.ipfs.stop();
    }
    async getStatus() {
        await this.initialized;
        return this.ipfs.getStatus();
    }
    async getNodeInfo(scope) {
        await this.initialized;
        return this.ipfs.getNodeInfo(scope);
    }
    async getStorageMetrics(scope) {
        await this.initialized;
        return this.ipfs.getStorageMetrics(scope);
    }
    async getPinnedCids(scope) {
        await this.initialized;
        return this.ipfs.getPinnedCids(scope);
    }
    async getConfiguration(scope) {
        await this.initialized;
        return this.ipfs.getConfiguration(scope);
    }
    // Pin Management Methods
    async pin(cid, scope) {
        await this.initialized;
        return this.ipfs.pin(cid, scope);
    }
    async unpin(cid, scope) {
        await this.initialized;
        return this.ipfs.unpin(cid, scope);
    }
    async replicate(cid, fromScope, toScope) {
        await this.initialized;
        return this.ipfs.replicate(cid, fromScope, toScope);
    }
    // Tool Wrapping Methods
    wrap(tools) {
        return tools.map(tool => this.wrapTool(tool));
    }
    wrapTool(tool) {
        return {
            originalTool: tool,
            wrappedDefinition: {
                ...tool,
                parameters: this.enhanceParameters(tool.parameters),
                returns: this.getReturnSchema()
            },
            execute: async (args) => {
                this.currentTool = tool.name;
                // Execute original tool
                const result = await tool.call(args);
                // Process hooks
                const metadata = { tool: tool.name, timestamp: (0, utils_1.generateTimestamp)() };
                const processed = await this.processHooks('pre-store', result, metadata);
                // Store in IPFS
                const options = args?.pipeOptions || {};
                const { cid, schemaCid } = await this.storeData(processed, options);
                // Post-store hooks
                await this.processHooks('post-store', { cid, data: processed }, metadata);
                return {
                    cid,
                    schemaCid,
                    description: tool.description,
                    type: tool.returns?.type || typeof result,
                    metadata
                };
            }
        };
    }
    enhanceParameters(originalParams) {
        return {
            ...originalParams,
            properties: {
                ...originalParams.properties,
                pipeOptions: {
                    type: 'object',
                    properties: {
                        scope: {
                            type: 'string',
                            enum: ['private', 'public', 'machine', 'user'],
                            default: 'private'
                        },
                        storeResult: {
                            type: 'boolean',
                            default: true
                        },
                        generateSchema: {
                            type: 'boolean',
                            default: true
                        },
                        pin: {
                            type: 'boolean',
                            default: true
                        }
                    }
                }
            }
        };
    }
    getReturnSchema() {
        return {
            type: 'object',
            properties: {
                cid: { type: 'string', description: 'IPFS Content Identifier' },
                schemaCid: { type: 'string', description: 'CID for JSON schema of returned data' },
                description: { type: 'string' },
                type: { type: 'string' },
                metadata: { type: 'object' }
            }
        };
    }
}
exports.PipeProtocol = PipeProtocol;
// Example Summary Hook
exports.summaryHook = {
    name: 'data-summarizer',
    trigger: 'pre-store',
    async handler(data, metadata) {
        const summary = await (0, utils_1.generateSummary)(data);
        return {
            ...data,
            metadata: {
                ...metadata,
                summary
            }
        };
    }
};
//# sourceMappingURL=pipe.js.map