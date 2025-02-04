/**
 * @file PersistentIpfsNode Implementation
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * This file implements a persistent IPFS node using Helia with filesystem-based storage.
 * 
 * IMPORTANT:
 * - All modifications must have corresponding tests
 * - Run `npm test` to verify changes
 * 
 * Functionality:
 * - Initializes a persistent IPFS node with filesystem storage
 * - Adds data and returns CIDs
 * - Retrieves data using CIDs
 * - Maintains data between sessions
 * - Properly manages node lifecycle
 * - Controls network exposure (enabled/disabled)
 */

import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import type { UnixFS } from '@helia/unixfs'
import { FsBlockstore } from 'blockstore-fs'
import { join } from 'path'
import { CID } from 'multiformats/cid'
import EventEmitter from 'events'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { mdns } from '@libp2p/mdns'
import { bootstrap } from '@libp2p/bootstrap'
import { type Libp2p } from '@libp2p/interface'
import { type PeerId } from '@libp2p/interface/peer-id'
import { multiaddr } from '@multiformats/multiaddr'

// Increase the default max listeners
EventEmitter.setMaxListeners(20)

export interface PersistentIpfsOptions {
  storageDirectory: string
  enableNetworking?: boolean
  listenAddresses?: string[]
  bootstrapList?: string[]
}

export class PersistentIpfsNode {
  private helia: Awaited<ReturnType<typeof createHelia>> | null = null
  private fs: UnixFS | null = null
  private blockstore: FsBlockstore | null = null
  private cidMap: Map<string, CID> = new Map()
  private readonly storageDirectory: string
  private readonly enableNetworking: boolean
  private readonly listenAddresses: string[]
  private readonly bootstrapList: string[]
  private isInitialized: boolean = false

  constructor(options: PersistentIpfsOptions) {
    this.storageDirectory = options.storageDirectory
    this.enableNetworking = options.enableNetworking ?? false
    this.listenAddresses = options.listenAddresses ?? ['/ip4/127.0.0.1/tcp/0']
    this.bootstrapList = options.bootstrapList ?? []
  }

  private async createLibp2p(): Promise<Libp2p> {
    if (!this.enableNetworking) {
      // Return a libp2p instance with networking disabled
      return await createLibp2p({
        start: false,
        addresses: {
          listen: []
        }
      })
    }

    const services: any = {
      identify: identify(),
      mdns: mdns({
        interval: 1000 // Faster discovery for testing
      })
    }

    // Only add bootstrap service if we have bootstrap peers
    if (this.bootstrapList.length > 0) {
      services.bootstrap = bootstrap({
        list: this.bootstrapList
      })
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
    })
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Create a blockstore using the filesystem
      this.blockstore = new FsBlockstore(join(this.storageDirectory, 'blocks'))
      await this.blockstore.open()

      // Create libp2p instance with appropriate networking configuration
      const libp2p = await this.createLibp2p()

      // Initialize Helia with the persistent blockstore and libp2p
      this.helia = await createHelia({
        blockstore: this.blockstore,
        libp2p
      })

      this.fs = unixfs(this.helia)
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize persistent IPFS node:', error)
      await this.cleanup()
      throw error
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.helia) {
        await this.helia.stop()
        this.helia = null
      }
      
      if (this.blockstore) {
        await this.blockstore.close()
        this.blockstore = null
      }

      this.fs = null
      this.cidMap.clear()
      this.isInitialized = false
    } catch (error) {
      console.error('Error during cleanup:', error)
      throw error
    }
  }

  async add(data: Uint8Array): Promise<string> {
    if (!this.isInitialized || !this.fs) {
      throw new Error('IPFS node not initialized')
    }

    try {
      const cid = await this.fs.addBytes(data)
      const cidStr = cid.toString()
      this.cidMap.set(cidStr, cid)
      return cidStr
    } catch (error) {
      console.error('Failed to add data:', error)
      throw error
    }
  }

  async get(cidStr: string): Promise<Uint8Array> {
    if (!this.isInitialized || !this.fs) {
      throw new Error('IPFS node not initialized')
    }

    try {
      // Try to get from cache first
      let cid = this.cidMap.get(cidStr)
      
      // If not in cache, try to parse it
      if (!cid) {
        try {
          cid = CID.parse(cidStr)
        } catch (error) {
          throw new Error('Invalid CID')
        }
      }

      let content = new Uint8Array()
      // Type assertion to handle CID version compatibility
      for await (const chunk of this.fs.cat(cid as any)) {
        const newContent = new Uint8Array(content.length + chunk.length)
        newContent.set(content)
        newContent.set(chunk, content.length)
        content = newContent
      }

      // Cache the successful CID for future use
      this.cidMap.set(cidStr, cid)
      return content
    } catch (error: unknown) {
      if (error instanceof Error && 
          (error.message.includes('not found') || error.message.includes('does not exist'))) {
        throw new Error('CID not found')
      }
      console.error('Failed to get data:', error)
      throw error
    }
  }

  async getMultiaddrs(): Promise<string[]> {
    if (!this.helia?.libp2p) {
      return []
    }
    return this.helia.libp2p.getMultiaddrs().map(ma => ma.toString())
  }

  async getPeerId(): Promise<PeerId | null> {
    return this.helia?.libp2p?.peerId ?? null
  }

  async dial(addr: string): Promise<void> {
    if (!this.enableNetworking || !this.helia?.libp2p) {
      throw new Error('Networking is disabled')
    }
    await this.helia.libp2p.dial(multiaddr(addr))
  }

  async stop(): Promise<void> {
    await this.cleanup()
  }
} 
