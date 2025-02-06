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

import { Helia, createHelia } from 'helia';
import { createLibp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { MemoryBlockstore } from 'blockstore-core';
import { FsBlockstore } from 'blockstore-fs';
import { identify } from '@libp2p/identify';
import { CID } from 'multiformats/cid';
import type { Libp2p } from '@libp2p/interface';
import { sha256 } from 'multiformats/hashes/sha2';
import * as raw from 'multiformats/codecs/raw';
import { multiaddr } from '@multiformats/multiaddr';

export interface IpfsNodeOptions {
  storage: 'memory' | 'persistent';
  storageConfig?: {
    directory: string;
  };
  enableNetworking?: boolean;
}

export class IpfsNode {
  private helia: Helia | null = null;
  private blockstore: MemoryBlockstore | FsBlockstore | null = null;
  private libp2p: Libp2p | null = null;

  constructor(private options: IpfsNodeOptions) {}

  async init(): Promise<void> {
    if (this.helia) {
      return; // Already initialized
    }

    try {
      const libp2p = await createLibp2p({
        addresses: {
          listen: this.options.enableNetworking === false ? [] : ['/ip4/127.0.0.1/tcp/0']
        },
        transports: this.options.enableNetworking === false ? [] : [tcp(), webSockets()],
        streamMuxers: [yamux()],
        connectionEncrypters: [noise()],
        services: {
          identify: identify()
        }
      });

      const blockstore = this.options.storage === 'memory'
        ? new MemoryBlockstore()
        : new FsBlockstore(this.options.storageConfig?.directory || '/tmp/ipfs');

      this.blockstore = blockstore;
      this.libp2p = libp2p;
      this.helia = await createHelia({
        libp2p,
        blockstore
      });
    } catch (error) {
      // Clean up any partially initialized resources
      await this.stop();
      throw error;
    }
  }

  async add(data: Uint8Array): Promise<string> {
    if (!this.helia?.blockstore) {
      throw new Error('IPFS node not initialized');
    }
    const hash = await sha256.digest(data);
    const cid = CID.createV1(raw.code, hash);
    await this.helia.blockstore.put(cid as any, data);
    await this.pin(cid.toString()); // Auto-pin content when adding
    return cid.toString();
  }

  async put(data: Uint8Array): Promise<string> {
    return this.add(data);
  }

  async get(cidStr: string): Promise<Uint8Array | null> {
    if (!this.helia?.blockstore) {
      throw new Error('IPFS node not initialized');
    }
    try {
      const cid = CID.parse(cidStr);
      return await this.helia.blockstore.get(cid as any, { signal: AbortSignal.timeout(5000) });
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  }

  async pin(cidStr: string): Promise<void> {
    if (!this.helia?.pins) {
      throw new Error('IPFS node not initialized');
    }
    const cid = CID.parse(cidStr);
    await this.helia.pins.add(cid as any);
  }

  async unpin(cidStr: string): Promise<void> {
    if (!this.helia?.pins) {
      throw new Error('IPFS node not initialized');
    }
    const cid = CID.parse(cidStr);
    await this.helia.pins.rm(cid as any);
  }

  async getPinnedCids(): Promise<string[]> {
    if (!this.helia?.pins) {
      throw new Error('IPFS node not initialized');
    }
    const pins = [];
    for await (const pin of this.helia.pins.ls()) {
      pins.push(pin.toString());
    }
    return pins;
  }

  getPeerId() {
    return this.libp2p?.peerId ?? null;
  }

  getMultiaddrs(): string[] {
    if (!this.libp2p) {
      return [];
    }
    return this.libp2p.getMultiaddrs().map(addr => addr.toString());
  }

  async dial(addr: string): Promise<void> {
    if (!this.libp2p) {
      throw new Error('IPFS node not initialized');
    }
    await this.libp2p.dial(multiaddr(addr));
  }

  async stop(): Promise<void> {
    if (this.helia) {
      await this.helia.stop();
      this.helia = null;
    }
    if (this.blockstore) {
      if (this.options.storage === 'persistent') {
        await (this.blockstore as FsBlockstore).close();
      }
      this.blockstore = null;
    }
    if (this.libp2p) {
      await this.libp2p.stop();
      this.libp2p = null;
    }
  }
} 