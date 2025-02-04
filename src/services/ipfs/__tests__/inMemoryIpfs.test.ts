/**
 * @file InMemoryIpfsNode Test Suite
 * @version 1.0.0
 * @status STABLE - COMPLETE TEST COVERAGE
 * @lastModified 2024-02-03
 * 
 * This file contains the complete test suite for the InMemoryIpfsNode implementation.
 * All core functionality is covered by these tests.
 * 
 * Test Coverage:
 * - Node initialization
 * - Data addition and retrieval
 * - Error handling for uninitialized nodes
 * - Multiple operation handling
 * - Node cleanup
 * - Multiple node instances
 * 
 * IMPORTANT:
 * - When adding new features to InMemoryIpfsNode, add corresponding tests here
 * - Maintain existing test coverage when modifying
 * - All tests must pass before committing changes
 */

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

  it('should support running multiple independent nodes', async () => {
    // Create a second node
    const node2 = new InMemoryIpfsNode()
    await node2.init()

    try {
      // Add different data to each node
      const data1 = new TextEncoder().encode('Data for node 1')
      const data2 = new TextEncoder().encode('Data for node 2')

      const cid1 = await node.add(data1)
      const cid2 = await node2.add(data2)

      // Verify the CIDs are different
      expect(cid1).not.toBe(cid2)

      // Try to get data1 from node1 (should succeed)
      const retrieved1 = new TextDecoder().decode(await node.get(cid1))
      expect(retrieved1).toBe('Data for node 1')

      // Try to get data2 from node2 (should succeed)
      const retrieved2 = new TextDecoder().decode(await node2.get(cid2))
      expect(retrieved2).toBe('Data for node 2')

      // Try to get data1 from node2 (should fail)
      await expect(node2.get(cid1)).rejects.toThrow('CID not found')

      // Try to get data2 from node1 (should fail)
      await expect(node.get(cid2)).rejects.toThrow('CID not found')
    } finally {
      // Clean up the second node
      await node2.stop()
    }
  })
}) 