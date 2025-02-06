import { IpfsClient } from '../src/ipfsClient.js';
import { PipeRecord } from '../src/types.js';
import { IpfsNode } from '../src/services/ipfs/ipfsNode.js';

async function testIpfs() {
  console.log('Testing IPFS functionality...');

  const node = new IpfsNode({
    storage: 'memory',
    storageConfig: {
      directory: '/tmp/ipfs-test'
    }
  });
  
  await node.init();
  const client = new IpfsClient(node);

  try {
    console.log('\nTest 1: Checking node status...');
    const status = await client.getStatus();
    console.assert(status.localNode === true, 'Local node should be initialized');
    console.assert(status.publicNode === true, 'Public node should be initialized');

    // Test 2: Publishing and Fetching
    console.log('Test 2: Testing publishing and fetching...');
    const testRecord: PipeRecord = {
      type: 'data',
      content: { test: 'data' },
      scope: 'private',
      pinned: true
    };
    
    const publishedRecord = await client.publish(testRecord);
    console.log('Published record:', publishedRecord);
    console.assert(publishedRecord.cid, 'Published record should have a CID');

    if (!publishedRecord.cid) {
      throw new Error('Published record CID is undefined');
    }

    const fetchedContent = await client.fetch(publishedRecord.cid, 'private');
    console.log('Fetched content:', fetchedContent);
    console.assert(JSON.stringify(fetchedContent) === JSON.stringify(testRecord.content), 
      'Fetched content should match original content');
    console.log('✓ Publishing and fetching test passed\n');

    // Test 3: Pinning Operations
    console.log('Test 3: Testing pinning operations...');
    const pinnedCids = await client.getPinnedCids('private');
    console.log('Pinned CIDs:', pinnedCids);
    console.assert(publishedRecord.cid && pinnedCids.includes(publishedRecord.cid), 
      'Published record should be in pinned CIDs');

    if (publishedRecord.cid) {
      await client.unpin(publishedRecord.cid, 'private');
      const afterUnpinCids = await client.getPinnedCids('private');
      console.assert(!afterUnpinCids.includes(publishedRecord.cid), 
        'Unpinned record should not be in pinned CIDs');
    }
    console.log('✓ Pinning operations test passed\n');

    // Test 4: Cross-scope Access Prevention
    console.log('Test 4: Testing cross-scope access prevention...');
    const machineRecord: PipeRecord = {
      type: 'data',
      content: { scope: 'machine-data' },
      scope: 'machine',
      pinned: true
    };
    
    const publishedMachineRecord = await client.publish(machineRecord);
    
    if (!publishedMachineRecord.cid) {
      throw new Error('Published machine record CID is undefined');
    }

    try {
      await client.fetch(publishedMachineRecord.cid, 'user');
      console.assert(false, 'Should not be able to fetch machine record from user scope');
    } catch (error) {
      console.log('✓ Successfully prevented cross-scope access');
    }
    console.log('✓ Cross-scope access prevention test passed\n');

    // Test 5: Storage Metrics and Configuration
    console.log('Test 5: Testing storage metrics and configuration...');
    const metrics = await client.getStorageMetrics('private');
    console.log('Storage metrics:', metrics);
    console.assert(typeof metrics.totalSize === 'number', 'Storage metrics should include total size');
    console.assert(typeof metrics.numObjects === 'number', 'Storage metrics should include number of objects');

    const config = await client.getConfiguration('private');
    console.log('Node configuration:', config);
    console.assert(config.peerId, 'Configuration should include peer ID');
    console.log('✓ Storage metrics and configuration test passed\n');

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.stop();
    console.log('IPFS client stopped.');
  }
}

testIpfs().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
}); 
