import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import type { UnixFS } from '@helia/unixfs'

export class InMemoryIpfsNode {
  private helia: Awaited<ReturnType<typeof createHelia>> | null = null
  private fs: UnixFS | null = null
  private cidMap: Map<string, any> = new Map()

  async init(): Promise<void> {
    try {
      this.helia = await createHelia({
        start: true
      })
      this.fs = unixfs(this.helia)
    } catch (error) {
      console.error('Failed to initialize Helia node:', error)
      throw error
    }
  }

  async add(data: Uint8Array): Promise<string> {
    if (!this.fs) {
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
    if (!this.fs) {
      throw new Error('IPFS node not initialized')
    }

    try {
      const cid = this.cidMap.get(cidStr)
      if (!cid) {
        throw new Error('CID not found')
      }

      let content = new Uint8Array()
      for await (const chunk of this.fs.cat(cid)) {
        const newContent = new Uint8Array(content.length + chunk.length)
        newContent.set(content)
        newContent.set(chunk, content.length)
        content = newContent
      }

      return content
    } catch (error) {
      console.error('Failed to get data:', error)
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.helia) {
      await this.helia.stop()
      this.helia = null
      this.fs = null
      this.cidMap.clear()
    }
  }
} 
