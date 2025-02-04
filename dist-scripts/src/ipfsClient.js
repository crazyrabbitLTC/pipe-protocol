"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpfsClient = void 0;
const ipfs_http_client_1 = require("ipfs-http-client");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class IpfsClient {
    constructor(config = {}) {
        this.isRunning = false;
        const { endpoint, options } = config;
        if (endpoint) {
            this.localNode = (0, ipfs_http_client_1.create)({ url: endpoint, ...options });
            this.publicNode = (0, ipfs_http_client_1.create)({ url: endpoint, ...options });
        }
    }
    async init(localNodeEndpoint, publicNodeEndpoint) {
        if (localNodeEndpoint) {
            this.localNode = (0, ipfs_http_client_1.create)({ url: localNodeEndpoint });
        }
        if (publicNodeEndpoint) {
            this.publicNode = (0, ipfs_http_client_1.create)({ url: publicNodeEndpoint });
        }
        this.isRunning = true;
        // Test connections
        try {
            if (!this.localNode || !this.publicNode) {
                throw new Error('IPFS nodes not initialized');
            }
            await Promise.all([
                this.localNode.id(),
                this.publicNode.id()
            ]);
        }
        catch (error) {
            console.error('Failed to initialize IPFS nodes:', error);
            throw error;
        }
    }
    getNodeForScope(scope) {
        if (!this.isRunning) {
            throw new Error('IPFS client is not running');
        }
        switch (scope) {
            case 'private':
            case 'machine':
                if (!this.localNode)
                    throw new Error('Local node not initialized');
                return this.localNode;
            case 'public':
            case 'user':
                if (!this.publicNode)
                    throw new Error('Public node not initialized');
                return this.publicNode;
            default:
                throw new Error(`Invalid scope: ${scope}`);
        }
    }
    async publish(record) {
        if (!this.isRunning) {
            throw new Error('IPFS client is not running');
        }
        const node = this.getNodeForScope(record.scope);
        try {
            // Store the entire record
            const result = await node.add(JSON.stringify(record));
            return {
                ...record,
                cid: result.path
            };
        }
        catch (error) {
            console.error('Error publishing to IPFS:', error);
            throw error;
        }
    }
    async fetch(cid, scope) {
        if (!this.isRunning) {
            throw new Error('IPFS client is not running');
        }
        const node = this.getNodeForScope(scope);
        try {
            const chunks = [];
            for await (const chunk of node.cat(cid)) {
                chunks.push(chunk);
            }
            const rawContent = Buffer.concat(chunks).toString();
            let record;
            try {
                record = JSON.parse(rawContent);
            }
            catch {
                // If we can't parse the content as a record, assume it's just the content
                record = {
                    cid,
                    content: rawContent,
                    type: 'data',
                    scope,
                    accessPolicy: { hiddenFromLLM: false },
                    encryption: { enabled: false }
                };
            }
            return record;
        }
        catch (error) {
            console.error('Error fetching from IPFS:', error);
            return null;
        }
    }
    async pin(cid, scope) {
        const node = this.getNodeForScope(scope);
        await node.pin.add(cid);
    }
    async unpin(cid, scope) {
        const node = this.getNodeForScope(scope);
        await node.pin.rm(cid);
    }
    async replicate(cid, fromScope, toScope) {
        const content = await this.fetch(cid, fromScope);
        if (!content) {
            throw new Error(`Content not found for CID: ${cid}`);
        }
        await this.publish({
            ...content,
            scope: toScope
        });
    }
    async stop() {
        if (this.isRunning) {
            try {
                if (this.localNode)
                    await this.localNode.stop();
                if (this.publicNode)
                    await this.publicNode.stop();
                this.isRunning = false;
            }
            catch (error) {
                console.error('Error stopping IPFS client:', error);
                throw error;
            }
        }
    }
    getStatus() {
        return this.isRunning;
    }
    async getNodeInfo(scope) {
        const node = this.getNodeForScope(scope);
        return node.id();
    }
    async getStorageMetrics(scope) {
        const node = this.getNodeForScope(scope);
        const stats = await node.stats.repo();
        return {
            repoSize: stats.repoSize,
            storageMax: stats.storageMax,
            numObjects: stats.numObjects
        };
    }
    async getPinnedCids(scope) {
        const node = this.getNodeForScope(scope);
        const pins = node.pin.ls();
        const cids = [];
        for await (const pin of pins) {
            cids.push(pin.cid.toString());
        }
        return cids;
    }
    getConfiguration(scope) {
        const node = this.getNodeForScope(scope);
        return {
            endpoint: node.getEndpointConfig(),
            scope
        };
    }
}
exports.IpfsClient = IpfsClient;
//# sourceMappingURL=ipfsClient.js.map