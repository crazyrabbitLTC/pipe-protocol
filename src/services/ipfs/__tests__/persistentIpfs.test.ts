/**
 * @file PersistentIpfsNode Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * This file contains tests for the PersistentIpfsNode implementation.
 * 
 * Test Coverage:
 * - Node initialization with storage directory
 * - Data addition and retrieval
 * - Error handling
 * - Multiple operation handling
 * - Data persistence between sessions
 * - Proper cleanup
 * - Independent node operation
 * - Network exposure control
 * 
 * IMPORTANT:
 * - All new features must have corresponding tests
 * - Run full test suite before committing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PersistentIpfsNode } from '../persistentIpfs'
import { join } from 'path'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'

describe('PersistentIpfsNode', () => {
  let node: PersistentIpfsNode
  let tempDir: string

  beforeEach(async () => {
    // Create a temporary directory for each test
    tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'))
    node = new PersistentIpfsNode({ storageDirectory: tempDir })
    await node.init()
  })

  afterEach(async () => {
    await node.stop()
    // Clean up the temporary directory
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should initialize successfully with storage directory', () => {
    expect(node).toBeInstanceOf(PersistentIpfsNode)
  })

  it('should add and retrieve data correctly', async () => {
    const testData = new TextEncoder().encode('Hello, Persistent IPFS!')
    const cid = await node.add(testData)
    
    expect(cid).toBeDefined()
    expect(typeof cid).toBe('string')
    
    const retrievedData = await node.get(cid)
    const decodedData = new TextDecoder().decode(retrievedData)
    
    expect(decodedData).toBe('Hello, Persistent IPFS!')
  })

  it('should persist data between node restarts', async () => {
    // Add data to the first instance
    const testData = new TextEncoder().encode('Data to persist')
    const cid = await node.add(testData)
    
    // Stop the first instance
    await node.stop()
    
    // Create a new instance with the same storage directory
    const newNode = new PersistentIpfsNode({ storageDirectory: tempDir })
    await newNode.init()
    
    try {
      // Try to retrieve the data from the new instance
      const retrievedData = await newNode.get(cid)
      const decodedData = new TextDecoder().decode(retrievedData)
      
      expect(decodedData).toBe('Data to persist')
    } finally {
      await newNode.stop()
    }
  })

  it('should handle multiple add and get operations', async () => {
    const data1 = new TextEncoder().encode('First persistent message')
    const data2 = new TextEncoder().encode('Second persistent message')
    
    const cid1 = await node.add(data1)
    const cid2 = await node.add(data2)
    
    expect(cid1).not.toBe(cid2)
    
    const retrieved1 = new TextDecoder().decode(await node.get(cid1))
    const retrieved2 = new TextDecoder().decode(await node.get(cid2))
    
    expect(retrieved1).toBe('First persistent message')
    expect(retrieved2).toBe('Second persistent message')
  })

  it('should throw error when not initialized', async () => {
    const newNode = new PersistentIpfsNode({ storageDirectory: tempDir })
    const testData = new TextEncoder().encode('Test')
    
    await expect(newNode.add(testData)).rejects.toThrow('IPFS node not initialized')
    await expect(newNode.get('dummy-cid')).rejects.toThrow('IPFS node not initialized')
  })

  it('should handle invalid CIDs gracefully', async () => {
    // Temporarily suppress console.error for this test
    const originalConsoleError = console.error
    console.error = vi.fn()
    
    try {
      await expect(node.get('invalid-cid')).rejects.toThrow('Invalid CID')
    } finally {
      // Restore console.error
      console.error = originalConsoleError
    }
  })

  it('should maintain separate data stores for different instances', async () => {
    // Create a second node with its own storage
    const tempDir2 = await mkdtemp(join(tmpdir(), 'ipfs-test-2-'))
    const node2 = new PersistentIpfsNode({ storageDirectory: tempDir2 })
    await node2.init()

    try {
      // Add data to both nodes
      const cid1 = await node.add(new TextEncoder().encode('node1 data'))
      const cid2 = await node2.add(new TextEncoder().encode('node2 data'))

      // Verify each node can read its own data immediately
      const node1Data = await node.get(cid1)
      const node2Data = await node2.get(cid2)
      expect(new TextDecoder().decode(node1Data)).toBe('node1 data')
      expect(new TextDecoder().decode(node2Data)).toBe('node2 data')

      // Set a short timeout for attempts to access other node's data
      // This prevents long waits while the nodes try to discover each other
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 1000))

      // Verify node1 cannot access node2's data
      await expect(Promise.race([
        node.get(cid2),
        timeoutPromise
      ])).rejects.toThrow()

      // Verify node2 cannot access node1's data
      await expect(Promise.race([
        node2.get(cid1),
        timeoutPromise
      ])).rejects.toThrow()
    } finally {
      await node2.stop()
      await rm(tempDir2, { recursive: true, force: true })
    }
  })

  describe('Network Exposure', () => {
    it('should operate in offline mode by default', async () => {
      const node1 = new PersistentIpfsNode({ storageDirectory: tempDir })
      const node2 = new PersistentIpfsNode({ 
        storageDirectory: await mkdtemp(join(tmpdir(), 'ipfs-test-2-'))
      })

      try {
        await node1.init()
        await node2.init()

        // Add data to node1
        const cid = await node1.add(new TextEncoder().encode('test data'))

        // Attempt to retrieve from node2 should fail quickly (under 2 seconds)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000))

        await expect(Promise.race([
          node2.get(cid),
          timeoutPromise
        ])).rejects.toThrow()

        // Verify nodes have no multiaddrs in offline mode
        expect(await node1.getMultiaddrs()).toHaveLength(0)
        expect(await node2.getMultiaddrs()).toHaveLength(0)
      } finally {
        await node1.stop()
        await node2.stop()
      }
    })

    it('should allow network communication when enabled', async () => {
      // Create two networked nodes
      const node1 = new PersistentIpfsNode({ 
        storageDirectory: tempDir,
        enableNetworking: true,
        listenAddresses: ['/ip4/127.0.0.1/tcp/0'] // Random port
      })
      
      const node2 = new PersistentIpfsNode({
        storageDirectory: await mkdtemp(join(tmpdir(), 'ipfs-test-2-')),
        enableNetworking: true,
        listenAddresses: ['/ip4/127.0.0.1/tcp/0'] // Random port
      })

      try {
        await node1.init()
        await node2.init()

        // Get node1's multiaddr and connect node2 to it
        const node1Addrs = await node1.getMultiaddrs()
        expect(node1Addrs.length).toBeGreaterThan(0)
        
        // Connect the nodes
        await node2.dial(node1Addrs[0])

        // Add data to node1
        const testData = 'test data for network sharing'
        const cid = await node1.add(new TextEncoder().encode(testData))

        // Node2 should be able to retrieve the data
        const retrievedData = await node2.get(cid)
        expect(new TextDecoder().decode(retrievedData)).toBe(testData)
      } finally {
        await node1.stop()
        await node2.stop()
      }
    }, 10000) // Reduced timeout since we're explicitly connecting nodes
  })
}) 
