import { PipeProtocol } from './pipe';
import { PipeRecord, PipeBundle, Scope } from './types';

interface Tool {
  name: string;
  description: string;
  call: (...args: any[]) => any;
}

interface PipeTool {
  name: string;
  description: string;
  call: (method: string, args: any) => Promise<PipeRecord | PipeBundle | null | void>;
}

export function pipe(tools: Tool[]): (Tool | PipeTool)[] {
  const pipeProtocol = new PipeProtocol();

  const pipeTool: PipeTool = {
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
    call: async (method: string, args: any) => {
      switch (method) {
        case 'publishRecord':
          return pipeProtocol.publishRecord(args as PipeRecord);
        case 'fetchRecord':
          return pipeProtocol.fetchRecord(args.cid, args.scope as Scope);
        case 'publishBundle':
          return pipeProtocol.publishBundle(args as PipeBundle);
        case 'pin':
          return pipeProtocol.pin(args.cid, args.scope as Scope);
        case 'unpin':
          return pipeProtocol.unpin(args.cid, args.scope as Scope);
        case 'replicate':
          return pipeProtocol.replicate(args.cid, args.fromScope as Scope, args.toScope as Scope);
        case 'getStatus':
          return pipeProtocol.getStatus();
        case 'getNodeInfo':
          return pipeProtocol.getNodeInfo(args.scope as Scope);
        case 'getStorageMetrics':
          return pipeProtocol.getStorageMetrics(args.scope as Scope);
        case 'getPinnedCids':
          return pipeProtocol.getPinnedCids(args.scope as Scope);
        case 'getConfiguration':
          return pipeProtocol.getConfiguration(args.scope as Scope);
        default:
          throw new Error(`Unknown Pipe method: ${method}`);
      }
    },
  };

  return [...tools, pipeTool];
}

export { PipeProtocol };
export { IpfsClient } from './ipfsClient';
export { EncryptionService } from './encryption';
export * from './types';

// Export the example summary hook
export { summaryHook } from './pipe'; 