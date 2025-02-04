import { PipeRecord, PipeBundle, Scope, PipeHook, StoreOptions, Tool, PipeOptions } from './types';
export declare class PipeProtocol {
    private ipfs;
    private encryption;
    private hooks;
    private currentTool;
    private initialized;
    constructor(options?: PipeOptions);
    private init;
    processHooks(trigger: 'pre-store' | 'post-store', data: any, metadata: Record<string, any>): Promise<any>;
    addHook(hook: PipeHook): void;
    storeData(data: any, options?: StoreOptions): Promise<{
        cid: string;
        schemaCid: string | null | undefined;
        timestamp: string;
    }>;
    private generateSchema;
    publishRecord(record: PipeRecord): Promise<PipeRecord>;
    publishBundle(bundle: PipeBundle): Promise<PipeBundle>;
    fetchRecord(cid: string, scope: Scope): Promise<PipeRecord | null>;
    stop(): Promise<void>;
    getStatus(): Promise<boolean>;
    getNodeInfo(scope: Scope): Promise<any>;
    getStorageMetrics(scope: Scope): Promise<any>;
    getPinnedCids(scope: Scope): Promise<string[]>;
    getConfiguration(scope: Scope): Promise<any>;
    pin(cid: string, scope: Scope): Promise<void>;
    unpin(cid: string, scope: Scope): Promise<void>;
    replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void>;
    wrap(tools: Tool[]): any[];
    private wrapTool;
    private enhanceParameters;
    private getReturnSchema;
}
export declare const summaryHook: PipeHook;
//# sourceMappingURL=pipe.d.ts.map