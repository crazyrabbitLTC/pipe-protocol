/**
 * @file IpfsNode Implementation
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-03
 * 
 * This file implements a unified IPFS node using Helia with configurable storage backends.
 * 
 * IMPORTANT:
 * - This is a STABLE implementation - any modifications require full test coverage
 * - All changes must maintain backward compatibility
 * - Changes affecting storage or networking require extensive testing
 * - Run full test suite before and after modifications
 * - Document all changes in the version history
 * 
 * Core Functionality:
 * - Configurable storage backend (memory or filesystem)
 * - Network exposure control (enabled/disabled)
 * - Data addition and retrieval with CID management
 * - Explicit data export/import for private nodes
 * - Node lifecycle management (init/cleanup)
 * - Peer-to-peer communication (when networking enabled)
 * 
 * Test Coverage Requirements:
 * - Storage operations (add/get/delete)
 * - Network isolation verification
 * - Error handling and recovery
 * - Resource cleanup
 * - Cross-node communication
 * - Data integrity verification
 */

import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import type { UnixFS } from '@helia/unixfs';
import { FsBlockstore } from 'blockstore-fs';
import { MemoryBlockstore } from 'blockstore-core';
import { join } from 'path';
import { CID } from 'multiformats/cid';
import EventEmitter from 'events';
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { identify } from '@libp2p/identify';
import { mdns } from '@libp2p/mdns';
import { bootstrap } from '@libp2p/bootstrap';
// @ts-expect-error Type compatibility issues between different versions of libp2p packages
import type { Libp2p } from '@libp2p/interface';
import type { PeerId } from '@libp2p/interface-peer-id';
import { multiaddr } from '@multiformats/multiaddr';
import type { Blockstore } from 'interface-blockstore';

// Increase the default max listeners
EventEmitter.setMaxListeners(20);

export type StorageType = 'memory' | 'persistent';

export interface IpfsNodeOptions {
  storage: StorageType;
  storageConfig?: {
    directory?: string;
  };
  enableNetworking?: boolean;
  listenAddresses?: string[];
  bootstrapList?: string[];
}

/**
 * Known type compatibility issues:
 * - libp2p service types between different package versions
 * - CID type differences between multiformats and @libp2p/interface
 * - PeerId type differences between interface packages
 * - Blockstore type safety
 * 
 * These are type-level incompatibilities only, the runtime behavior is correct.
 * TODO(TypeScript): Create proper type definitions and align dependency versions.
 * The following issues need to be addressed:
 * 1. Libp2p Service Type Compatibility
 *    - Different versions of libp2p packages have incompatible service type definitions
 *    - Affects service configuration in createLibp2p()
 * 
 * 2. CID Type Differences
 *    - Incompatibility between multiformats and @libp2p/interface CID types
 *    - Type mismatch in toV0()[Symbol.toStringTag]
 * 
 * 3. PeerId Type Differences
 *    - Incompatibility between interface packages for PeerId
 *    - Missing properties: multihash, toBytes in RSAPeerId
 * 
 * 4. Blockstore Type Safety
 *    - Type 'unknown' for blockstore operations
 *    - Affects cleanup and initialization
 * 
 * Current workarounds:
 * - Using type assertions (as any) for Helia initialization
 * - @ts-expect-error directives for libp2p service configuration
 * - Runtime type checks for blockstore operations
 */

export class IpfsNode {
  private helia: Awaited<ReturnType<typeof createHelia>> | null = null;
  private fs: UnixFS | null = null;
  private blockstore: Blockstore | null = null;
  private cidMap: Map<string, CID> = new Map();
  private readonly storageType: StorageType;
  private readonly storageDirectory?: string;
  private readonly enableNetworking: boolean;
  private readonly listenAddresses: string[];
  private readonly bootstrapList: string[];
  private isInitialized: boolean = false;

  constructor(options: IpfsNodeOptions) {
    this.storageType = options.storage;
    this.storageDirectory = options.storageConfig?.directory;
    this.enableNetworking = options.enableNetworking ?? false;
    this.listenAddresses = options.listenAddresses ?? ['/ip4/127.0.0.1/tcp/0'];
    this.bootstrapList = options.bootstrapList ?? [];

    if (this.storageType === 'persistent' && !this.storageDirectory) {
      throw new Error('Storage directory is required for persistent storage');
    }
  }

  // Core node lifecycle methods
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.blockstore = await this.createBlockstore();
      const libp2p = await this.createLibp2p();

      this.helia = await createHelia({
        blockstore: this.blockstore as any,
        libp2p: libp2p as any
      });

      this.fs = unixfs(this.helia);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize IPFS node:', error);
      await this.cleanup();
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.cleanup();
  }

  // Core data operations
  async add(data: Uint8Array): Promise<string> {
    if (!this.isInitialized || !this.fs) {
      throw new Error('IPFS node not initialized');
    }

    try {
      const cid = await this.fs.addBytes(data);
      const cidStr = cid.toString();
      this.cidMap.set(cidStr, cid);
      return cidStr;
    } catch (error) {
      console.error('Failed to add data:', error);
      throw error;
    }
  }

  async get(cidStr: string): Promise<Uint8Array> {
    if (!this.isInitialized || !this.fs) {
      throw new Error('IPFS node not initialized');
    }

    try {
      let cid = this.cidMap.get(cidStr);
      
      if (!cid) {
        try {
          cid = CID.parse(cidStr);
        } catch (error) {
          throw new Error('Invalid CID');
        }
      }

      if (!this.enableNetworking) {
        const exists = await this.blockstore?.has(cid as any);
        if (!exists) {
          throw new Error('CID not found');
        }
      }

      let content = new Uint8Array();
      for await (const chunk of this.fs.cat(cid as any)) {
        const newContent = new Uint8Array(content.length + chunk.length);
        newContent.set(content);
        newContent.set(chunk, content.length);
        content = newContent;
      }

      this.cidMap.set(cidStr, cid);
      return content;
    } catch (error: unknown) {
      if (error instanceof Error && 
          (error.message.includes('not found') || error.message.includes('does not exist'))) {
        throw new Error('CID not found');
      }
      console.error('Failed to get data:', error);
      throw error;
    }
  }

  // Network operations
  async getMultiaddrs(): Promise<string[]> {
    if (!this.helia?.libp2p) {
      return [];
    }
    return this.helia.libp2p.getMultiaddrs().map(ma => ma.toString());
  }

  async getPeerId(): Promise<PeerId | null> {
    return this.helia?.libp2p?.peerId ?? null;
  }

  async dial(addr: string): Promise<void> {
    if (!this.enableNetworking || !this.helia?.libp2p) {
      throw new Error('Networking is disabled');
    }
    await this.helia.libp2p.dial(multiaddr(addr));
  }

  // Internal helper methods
  private async cleanup(): Promise<void> {
    try {
      if (this.helia) {
        await this.helia.stop();
        this.helia = null;
      }
      
      if (this.blockstore) {
        if ('close' in this.blockstore) {
          await this.blockstore.close();
        }
        this.blockstore = null;
      }

      this.fs = null;
      this.cidMap.clear();
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  private async createBlockstore(): Promise<Blockstore> {
    if (this.storageType === 'persistent' && this.storageDirectory) {
      const store = new FsBlockstore(join(this.storageDirectory, 'blocks'));
      await store.open();
      return store;
    } else {
      return new MemoryBlockstore();
    }
  }

  private async createLibp2p(): Promise<Libp2p> {
    if (!this.enableNetworking) {
      // @ts-expect-error Offline mode configuration is valid but types don't align
      return await createLibp2p({
        start: false,
        addresses: { listen: [] },
        transports: [],
        connectionEncrypters: [],
        streamMuxers: [],
        services: {},
        peerDiscovery: []
      });
    }

    // @ts-expect-error Service type compatibility between versions
    const services = {
      identify: identify(),
      mdns: mdns({ interval: 1000 })
    };

    if (this.bootstrapList.length > 0) {
      // @ts-expect-error Bootstrap service type compatibility
      services.bootstrap = bootstrap({
        list: this.bootstrapList
      });
    }

    // @ts-expect-error Service map compatibility between versions
    return await createLibp2p({
      addresses: {
        listen: this.listenAddresses
      },
      transports: [tcp()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services
    });
  }
} 