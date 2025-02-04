/**
 * @file IpfsClient Test Suite
 * @version 1.0.0
 * @status IN_DEVELOPMENT
 * @lastModified 2024-02-03
 * 
 * This file contains tests for the IpfsClient implementation,
 * demonstrating how it works with IpfsNode.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IpfsClient } from '../../../ipfsClient';
import { IpfsNode } from '../ipfsNode';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('IpfsClient', () => {
  let node: IpfsNode;
  let client: IpfsClient;
  let tempDir: string;

  beforeEach(async () => {
    // Create a persistent node for testing
    tempDir = await mkdtemp(join(tmpdir(), 'ipfs-test-'));
    node = new IpfsNode({
      storage: 'persistent',
      storageConfig: { directory: tempDir }
    });
    await node.init();
    
    // Create client using the node
    client = new IpfsClient(node);
    await client.init();
  });

  afterEach(async () => {
    await client.stop();
    await node.stop();
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should publish and fetch records', async () => {
    const record = {
      content: { message: 'Hello, IPFS!' },
      scope: 'private',
      type: 'data',
      pinned: false,
      accessPolicy: { hiddenFromLLM: false }
    };

    // Publish record
    const published = await client.publish(record);
    expect(published.cid).toBeDefined();
    expect(published.content).toEqual(record.content);

    // Fetch record
    const fetched = await client.fetch(published.cid, 'private');
    expect(fetched.content).toEqual(record.content);
  });

  it('should replicate records between scopes', async () => {
    const record = {
      content: { message: 'Replicate me!' },
      scope: 'private',
      type: 'data',
      pinned: false,
      accessPolicy: { hiddenFromLLM: false }
    };

    // Publish to private scope
    const published = await client.publish(record);

    // Replicate to public scope
    await client.replicate(published.cid, 'private', 'public');

    // Fetch from public scope
    const fetched = await client.fetch(published.cid, 'public');
    expect(fetched.content).toEqual(record.content);
    expect(fetched.scope).toBe('public');
  });

  it('should provide correct node status', () => {
    const status = client.getStatus();
    expect(status.localNode).toBe(true);
    expect(status.publicNode).toBe(false); // Default is offline mode
  });

  it('should provide node configuration', async () => {
    const config = await client.getConfiguration('private');
    expect(config.peerId).toBeDefined();
    expect(Array.isArray(config.addrs)).toBe(true);
  });

  describe('Network Communication', () => {
    it('should share data between networked clients', async () => {
      // Create two nodes with networking enabled
      const node1 = new IpfsNode({
        storage: 'memory',
        enableNetworking: true,
        listenAddresses: ['/ip4/127.0.0.1/tcp/0']
      });
      const node2 = new IpfsNode({
        storage: 'memory',
        enableNetworking: true,
        listenAddresses: ['/ip4/127.0.0.1/tcp/0']
      });

      const client1 = new IpfsClient(node1);
      const client2 = new IpfsClient(node2);

      try {
        await node1.init();
        await node2.init();
        await client1.init();
        await client2.init();

        // Connect the nodes
        const addrs = await node1.getMultiaddrs();
        await node2.dial(addrs[0]);

        // Publish record through client1
        const record = {
          content: { message: 'Shared data!' },
          scope: 'public',
          type: 'data',
          pinned: false,
          accessPolicy: { hiddenFromLLM: false }
        };
        const published = await client1.publish(record);

        // Fetch through client2
        const fetched = await client2.fetch(published.cid, 'public');
        expect(fetched.content).toEqual(record.content);
      } finally {
        await client1.stop();
        await client2.stop();
        await node1.stop();
        await node2.stop();
      }
    }, 10000);
  });
}); 
