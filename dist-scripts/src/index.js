"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryHook = exports.EncryptionService = exports.IpfsClient = exports.PipeProtocol = void 0;
exports.pipe = pipe;
const pipe_1 = require("./pipe");
Object.defineProperty(exports, "PipeProtocol", { enumerable: true, get: function () { return pipe_1.PipeProtocol; } });
function pipe(tools) {
    const pipeProtocol = new pipe_1.PipeProtocol();
    const pipeTool = {
        name: 'Pipe',
        description: `
      A special tool that allows referencing large data via IPFS.
      You can publish data or fetch data by CID.
      Example usage:
        - publishRecord({type, content, scope, pinned, encryption, accessPolicy})
        - fetchRecord(cid, scope)
        - publishBundle({schemaRecord, dataRecord, combinedScope})
        - pin(cid, scope)
        - unpin(cid, scope)
        - replicate(cid, fromScope, toScope)
        - getStatus()
        - getNodeInfo(scope)
        - getStorageMetrics(scope)
        - getPinnedCids(scope)
        - getConfiguration(scope)
      The LLM typically should not decrypt hidden data if hiddenFromLLM = true.
    `,
        call: async (method, args) => {
            switch (method) {
                case 'publishRecord':
                    return pipeProtocol.publishRecord(args);
                case 'fetchRecord':
                    return pipeProtocol.fetchRecord(args.cid, args.scope);
                case 'publishBundle':
                    return pipeProtocol.publishBundle(args);
                case 'pin':
                    return pipeProtocol.pin(args.cid, args.scope);
                case 'unpin':
                    return pipeProtocol.unpin(args.cid, args.scope);
                case 'replicate':
                    return pipeProtocol.replicate(args.cid, args.fromScope, args.toScope);
                case 'getStatus':
                    return pipeProtocol.getStatus();
                case 'getNodeInfo':
                    return pipeProtocol.getNodeInfo(args.scope);
                case 'getStorageMetrics':
                    return pipeProtocol.getStorageMetrics(args.scope);
                case 'getPinnedCids':
                    return pipeProtocol.getPinnedCids(args.scope);
                case 'getConfiguration':
                    return pipeProtocol.getConfiguration(args.scope);
                default:
                    throw new Error(`Unknown Pipe method: ${method}`);
            }
        },
    };
    return [...tools, pipeTool];
}
var ipfsClient_1 = require("./ipfsClient");
Object.defineProperty(exports, "IpfsClient", { enumerable: true, get: function () { return ipfsClient_1.IpfsClient; } });
var encryption_1 = require("./encryption");
Object.defineProperty(exports, "EncryptionService", { enumerable: true, get: function () { return encryption_1.EncryptionService; } });
__exportStar(require("./types"), exports);
// Export the example summary hook
var pipe_2 = require("./pipe");
Object.defineProperty(exports, "summaryHook", { enumerable: true, get: function () { return pipe_2.summaryHook; } });
//# sourceMappingURL=index.js.map