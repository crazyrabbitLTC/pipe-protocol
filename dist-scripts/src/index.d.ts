import { PipeProtocol } from './pipe';
import { PipeRecord, PipeBundle } from './types';
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
export declare function pipe(tools: Tool[]): (Tool | PipeTool)[];
export { PipeProtocol };
export { IpfsClient } from './ipfsClient';
export { EncryptionService } from './encryption';
export * from './types';
export { summaryHook } from './pipe';
//# sourceMappingURL=index.d.ts.map