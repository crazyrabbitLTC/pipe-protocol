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
    // Temporarily suppress console.error for expected CID not found errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const errorMessage = args.join(' ');
      // Only suppress 'Failed to get data: Error: CID not found' messages
      if (!errorMessage.includes('Failed to get data: Error: CID not found')) {
        originalConsoleError(...args);
      }
    };

    try {
      // Create two independent nodes
      const node1 = new InMemoryIpfsNode();
      const node2 = new InMemoryIpfsNode();
      
      await node1.init();
      await node2.init();

      // Add data to both nodes
      const cid1 = await node1.add(new TextEncoder().encode('node1 data'));
      const cid2 = await node2.add(new TextEncoder().encode('node2 data'));

      // Verify each node can read its own data
      const node1Data = await node1.get(cid1);
      const node2Data = await node2.get(cid2);
      expect(new TextDecoder().decode(node1Data)).toBe('node1 data');
      expect(new TextDecoder().decode(node2Data)).toBe('node2 data');

      // Verify nodes cannot access each other's data
      await expect(node1.get(cid2)).rejects.toThrow('CID not found');
      await expect(node2.get(cid1)).rejects.toThrow('CID not found');

      await node1.stop();
      await node2.stop();
    } finally {
      // Restore original console.error
      console.error = originalConsoleError;
    }
  })
}) 