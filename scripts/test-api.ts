import { PipeProtocol } from '../src/pipe';
import { createApi } from '../src/api';
import { AddressInfo } from 'net';

async function testApi() {
  console.log('Starting API test...\n');
  
  const pipe = new PipeProtocol({});
  const app = createApi(pipe);
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;

  try {
    console.log(`API server started on port ${port}`);

    // Test 1: Publish a record via API
    console.log('\nTest 1: Publishing a record via API...');
    const record = {
      type: 'data' as const,
      content: { message: 'Hello from API!' },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false }
    };

    const publishResponse = await fetch(`http://localhost:${port}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    const published = await publishResponse.json();
    console.log('Published record:', published);

    // Test 2: Fetch the record via API
    console.log('\nTest 2: Fetching the record via API...');
    if (published.cid) {
      const fetchResponse = await fetch(
        `http://localhost:${port}/fetch?cid=${published.cid}&scope=private`
      );
      const fetched = await fetchResponse.json();
      console.log('Fetched record:', fetched);

      // Verify content matches
      const contentMatches = JSON.stringify(fetched?.content) === JSON.stringify(record.content);
      console.log('Content matches original:', contentMatches);
    }

    // Test 3: Get node status via API
    console.log('\nTest 3: Getting node status via API...');
    const statusResponse = await fetch(`http://localhost:${port}/node-status`);
    const status = await statusResponse.json();
    console.log('Node status:', status);

    // Test 4: Pin the record via API
    console.log('\nTest 4: Pinning the record via API...');
    if (published.cid) {
      const pinResponse = await fetch(`http://localhost:${port}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid: published.cid, scope: 'private' })
      });
      console.log('Pin response status:', pinResponse.status);
    }

    // Test 5: Get pinned CIDs via API
    console.log('\nTest 5: Getting pinned CIDs via API...');
    const pinnedResponse = await fetch(
      `http://localhost:${port}/pinned-cids?scope=private`
    );
    const pinnedCids = await pinnedResponse.json();
    console.log('Pinned CIDs:', pinnedCids);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    server.close();
    await pipe.stop();
    console.log('\nTest completed, server stopped, and node stopped.');
  }
}

testApi().catch(console.error); 