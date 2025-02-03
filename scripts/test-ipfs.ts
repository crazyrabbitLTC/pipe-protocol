import { IpfsClient } from '../src/ipfsClient.js';
import { PipeRecord, Scope } from '../src/types.js';
import { CID } from 'multiformats/cid';

async function testIpfsClient() {
  console.log('Starting IPFS Client tests...\n');
  const client = new IpfsClient();

  try {
    // Test 1: Node Initialization and Status
    console.log('Test 1: Testing node initialization and status...');
    const status = await client.getStatus();
    console.log('Node status:', status);
    console.assert(status.localNode === true, 'Local node should be initialized');
    console.assert(status.machineNode === true, 'Machine node should be initialized');
    console.assert(status.userNode === true, 'User node should be initialized');
    console.assert(status.publicNode === true, 'Public node should be initialized');
    console.log('✓ Node initialization test passed\n');

    // Test 2: Publishing and Fetching
    console.log('Test 2: Testing publishing and fetching...');
    const testRecord: PipeRecord = {
      type: 'data',
      content: { test: 'data' },
      scope: 'private',
      pinned: true,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    const publishedRecord = await client.publish(testRecord);
    console.log('Published record:', publishedRecord);
    console.assert(publishedRecord.cid, 'Published record should have a CID');
    console.assert(CID.parse(publishedRecord.cid || '').version === 1, 'CID should be version 1');

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
    console.assert(pinnedCids.length === 1, 'Should have exactly one pinned CID');

    if (publishedRecord.cid) {
      await client.unpin(publishedRecord.cid, 'private');
      const afterUnpinCids = await client.getPinnedCids('private');
      console.assert(!afterUnpinCids.includes(publishedRecord.cid), 
        'Unpinned record should not be in pinned CIDs');
      console.assert(afterUnpinCids.length === 0, 'Should have no pinned CIDs after unpinning');
    }
    console.log('✓ Pinning operations test passed\n');

    // Test 4: Cross-scope Access Prevention
    console.log('Test 4: Testing cross-scope access prevention...');
    const machineRecord: PipeRecord = {
      type: 'data',
      content: { scope: 'machine-data' },
      scope: 'machine',
      pinned: true,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    const publishedMachineRecord = await client.publish(machineRecord);
    console.assert(publishedMachineRecord.cid, 'Machine record should have a CID');
    
    if (!publishedMachineRecord.cid) {
      throw new Error('Published machine record CID is undefined');
    }

    try {
      await client.fetch(publishedMachineRecord.cid, 'user');
      console.assert(false, 'Should not be able to fetch machine record from user scope');
    } catch (error) {
      if (error instanceof Error) {
        console.assert(error.message.includes('not available'), 'Error message should indicate content is not available');
      } else {
        throw new Error('Expected an Error instance');
      }
      console.log('✓ Successfully prevented cross-scope access');
    }
    console.log('✓ Cross-scope access prevention test passed\n');

    // Test 5: Error Cases
    console.log('Test 5: Testing error cases...');
    
    // Test invalid CID
    try {
      await client.fetch('invalid-cid', 'private');
      console.assert(false, 'Should not be able to fetch with invalid CID');
    } catch (error) {
      console.assert(error instanceof Error, 'Error should be an Error instance');
      console.log('✓ Successfully handled invalid CID');
    }

    // Test unpinning non-existent CID
    try {
      await client.unpin('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi', 'private');
      console.log('✓ Successfully handled unpinning non-existent CID');
    } catch (error) {
      console.assert(false, 'Unpinning non-existent CID should not throw');
    }

    // Test fetching from wrong scope
    try {
      const wrongScopeRecord: PipeRecord = {
        type: 'data',
        content: { test: 'wrong-scope' },
        scope: 'private',
        pinned: true
      };
      const published = await client.publish(wrongScopeRecord);
      if (!published.cid) throw new Error('Published record CID is undefined');
      
      await client.fetch(published.cid, 'public');
      console.assert(false, 'Should not be able to fetch from wrong scope');
    } catch (error) {
      console.assert(error instanceof Error, 'Error should be an Error instance');
      console.log('✓ Successfully prevented wrong scope access');
    }
    console.log('✓ Error cases test passed\n');

    // Test 6: Storage Metrics and Configuration
    console.log('Test 6: Testing storage metrics and configuration...');
    const metrics = await client.getStorageMetrics('private');
    console.log('Storage metrics:', metrics);
    console.assert(typeof metrics.repoSize === 'number', 'Storage metrics should include repo size');
    console.assert('blockCount' in metrics, 'Storage metrics should include block count');
    console.assert('pinnedCount' in metrics, 'Storage metrics should include pinned count');

    const config = await client.getConfiguration('private');
    console.log('Node configuration:', config);
    console.assert(config.peerId && typeof config.peerId === 'string', 'Configuration should include peer ID as string');
    console.assert(Array.isArray(config.addrs), 'Configuration should include addresses array');
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

testIpfsClient().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
}); 
