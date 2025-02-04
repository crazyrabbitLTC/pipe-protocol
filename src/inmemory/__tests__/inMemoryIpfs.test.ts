import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { InMemoryIpfsNode } from '../inMemoryIpfs'

describe('InMemoryIpfsNode', () => {
  let node: InMemoryIpfsNode

  beforeEach(async () => {
    node = new InMemoryIpfsNode()
    await node.init()
  })

  afterEach(async () => {
    await node.stop()
  })

  it('should initialize successfully', () => {
    expect(node).toBeInstanceOf(InMemoryIpfsNode)
  })

  it('should add and retrieve data correctly', async () => {
    const testData = new TextEncoder().encode('Hello, IPFS!')
    const cid = await node.add(testData)
    
    expect(cid).toBeDefined()
    expect(typeof cid).toBe('string')
    
    const retrievedData = await node.get(cid)
    const decodedData = new TextDecoder().decode(retrievedData)
    
    expect(decodedData).toBe('Hello, IPFS!')
  })

  it('should throw error when not initialized', async () => {
    const newNode = new InMemoryIpfsNode()
    const testData = new TextEncoder().encode('Test')
    
    await expect(newNode.add(testData)).rejects.toThrow('IPFS node not initialized')
    await expect(newNode.get('dummy-cid')).rejects.toThrow('IPFS node not initialized')
  })

  it('should handle multiple add and get operations', async () => {
    const data1 = new TextEncoder().encode('First message')
    const data2 = new TextEncoder().encode('Second message')
    
    const cid1 = await node.add(data1)
    const cid2 = await node.add(data2)
    
    expect(cid1).not.toBe(cid2)
    
    const retrieved1 = new TextDecoder().decode(await node.get(cid1))
    const retrieved2 = new TextDecoder().decode(await node.get(cid2))
    
    expect(retrieved1).toBe('First message')
    expect(retrieved2).toBe('Second message')
  })
}) 