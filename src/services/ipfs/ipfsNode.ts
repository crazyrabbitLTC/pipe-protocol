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
import type { Libp2p, ServiceMap } from '@libp2p/interface';
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

  private async createBlockstore(): Promise<Blockstore> {
    if (this.storageType === 'persistent' && this.storageDirectory) {
      const store = new FsBlockstore(join(this.storageDirectory, 'blocks'));
      await store.open();
      return store;
    } else {
      return new MemoryBlockstore();
    }
  }

  private async createLibp2p(): Promise<Libp2p<ServiceMap>> {
    if (!this.enableNetworking) {
      // Return a completely offline libp2p instance
      return await createLibp2p({
        start: false,
        addresses: {
          listen: []
        },
        transports: [], // No transports
        connectionEncrypters: [], // No encryption needed
        streamMuxers: [], // No stream multiplexing
        services: {}, // No services
        peerDiscovery: [] // No peer discovery
      });
    }

    const services: any = {
      identify: identify(),
      mdns: mdns({
        interval: 1000 // Faster discovery for testing
      })
    };

    // Only add bootstrap service if we have bootstrap peers
    if (this.bootstrapList.length > 0) {
      services.bootstrap = bootstrap({
        list: this.bootstrapList
      });
    }

    // Return a fully networked libp2p instance
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

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.blockstore = await this.createBlockstore();
      const libp2p = await this.createLibp2p();

      this.helia = await createHelia({
        blockstore: this.blockstore as any,
        libp2p
      });

      this.fs = unixfs(this.helia);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize IPFS node:', error);
      await this.cleanup();
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.helia) {
        await this.helia.stop();
        this.helia = null;
      }
      
      if (this.blockstore) {
        // FsBlockstore has close method, MemoryBlockstore doesn't
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
      // Try to get from cache first
      let cid = this.cidMap.get(cidStr);
      
      // If not in cache, try to parse it
      if (!cid) {
        try {
          cid = CID.parse(cidStr);
        } catch (error) {
          throw new Error('Invalid CID');
        }
      }

      // In offline mode, only return data if it's in our blockstore
      if (!this.enableNetworking) {
        const exists = await this.blockstore?.has(cid);
        if (!exists) {
          throw new Error('CID not found');
        }
      }

      let content = new Uint8Array();
      // Type assertion to handle CID version compatibility
      for await (const chunk of this.fs.cat(cid as any)) {
        const newContent = new Uint8Array(content.length + chunk.length);
        newContent.set(content);
        newContent.set(chunk, content.length);
        content = newContent;
      }

      // Cache the successful CID for future use
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

  async stop(): Promise<void> {
    await this.cleanup();
  }

  /**
   * Exports the raw data for a given CID. This allows private nodes to
   * explicitly share specific content without network connectivity.
   */
  async exportData(cidStr: string): Promise<{ data: Uint8Array; cid: string }> {
    const data = await this.get(cidStr);
    return { data, cid: cidStr };
  }

  /**
   * Imports previously exported data. The imported content will have the
   * same CID as the original since IPFS CIDs are content-addressed.
   */
  async importData(data: Uint8Array): Promise<string> {
    return await this.add(data);
  }
} 