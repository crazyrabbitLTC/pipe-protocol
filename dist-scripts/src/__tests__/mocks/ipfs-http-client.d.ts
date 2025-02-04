export declare const mockDataStore: Map<string, any>;
export declare const mockPinnedCids: Set<string>;
export declare const mockRecordStore: Map<string, any>;
export declare const create: jest.Mock<{
    add: jest.Mock<any, any, any>;
    cat: jest.Mock<any, any, any>;
    pin: {
        add: jest.Mock<any, any, any>;
        rm: jest.Mock<any, any, any>;
        ls: jest.Mock<any, any, any>;
    };
    id: jest.Mock<any, any, any>;
    stats: {
        repo: jest.Mock<any, any, any>;
    };
    stop: jest.Mock<any, any, any>;
    getEndpointConfig: jest.Mock<any, any, any>;
}, [], any>;
export type { IPFSHTTPClient } from 'ipfs-http-client';
//# sourceMappingURL=ipfs-http-client.d.ts.map