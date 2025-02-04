import { PipeRecord, Scope, PipeIpfsOptions } from './types';
export declare class IpfsClient {
    private localNode?;
    private publicNode?;
    private isRunning;
    constructor(config?: PipeIpfsOptions);
    init(localNodeEndpoint?: string, publicNodeEndpoint?: string): Promise<void>;
    private getNodeForScope;
    publish(record: PipeRecord): Promise<PipeRecord>;
    fetch(cid: string, scope: Scope): Promise<PipeRecord | null>;
    pin(cid: string, scope: Scope): Promise<void>;
    unpin(cid: string, scope: Scope): Promise<void>;
    replicate(cid: string, fromScope: Scope, toScope: Scope): Promise<void>;
    stop(): Promise<void>;
    getStatus(): boolean;
    getNodeInfo(scope: Scope): Promise<any>;
    getStorageMetrics(scope: Scope): Promise<any>;
    getPinnedCids(scope: Scope): Promise<string[]>;
    getConfiguration(scope: Scope): any;
}
//# sourceMappingURL=ipfsClient.d.ts.map