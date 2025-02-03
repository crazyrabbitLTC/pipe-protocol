import { PipeProtocol } from '../src/pipe.js';

async function testBasicOperations() {
  console.log('Starting basic operations test...\n');
  
  let pipe: PipeProtocol | undefined;

  try {
    pipe = new PipeProtocol({});

    // Test 1: Publish a simple record
    console.log('Test 1: Publishing a simple record...');
    const record = {
      type: 'data' as const,
      content: { message: 'Hello, IPFS!' },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false },
      pinned: true
    };

    const published = await pipe.publishRecord(record);
    console.log('Published record:', {
      cid: published.cid,
      content: published.content
    });

    // Test 2: Fetch the published record
    console.log('\nTest 2: Fetching the published record...');
    if (published.cid) {
      const fetched = await pipe.fetchRecord(published.cid, 'private');
      console.log('Fetched record:', fetched);

      // Verify content matches
      const contentMatches = JSON.stringify(fetched?.content) === JSON.stringify(record.content);
      console.log('Content matches original:', contentMatches);
    }

    // Test 3: Pin the record
    console.log('\nTest 3: Pinning the record...');
    if (published.cid) {
      await pipe.pin(published.cid, 'private');
      console.log('Record pinned successfully');
    }

    // Test 4: Get pinned CIDs
    console.log('\nTest 4: Getting pinned CIDs...');
    const pinnedCids = await pipe.getPinnedCids('private');
    console.log('Pinned CIDs:', pinnedCids);

    // Verify the published CID is in the pinned list
    if (published.cid) {
      const isPinned = pinnedCids.includes(published.cid);
      console.log('Published CID is pinned:', isPinned);
    }

    // Test 5: Get node status
    console.log('\nTest 5: Getting node status...');
    const status = await pipe.getStatus();
    console.log('Node status:', status);

  } catch (error) {
    console.error('Error during test:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    try {
      if (pipe) {
        await pipe.stop();
        console.log('\nTest completed and node stopped.');
      }
    } catch (error) {
      console.error('Error stopping node:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      process.exit(1);
    }
  }
}

// Run the test
(async () => {
  try {
    await testBasicOperations();
  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
})(); 
