import { PipeProtocol } from '../src/pipe.js';
import { createApi } from '../src/api.js';
import { AddressInfo } from 'net';
import { request } from 'http';
import { Server } from 'http';

async function testApi() {
  console.log('Starting API test...\n');
  
  const pipe = new PipeProtocol({});
  const app = createApi(pipe);
  let server: Server | undefined;

  try {
    // Start the API server
    server = app.listen(0); // Use port 0 to get a random available port
    const address = server.address() as AddressInfo;
    const port = address.port;
    console.log(`API server started on port ${port}\n`);

    // Helper function to make API requests
    async function makeRequest(method: string, path: string, body?: any): Promise<{ status: number; data: any }> {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: port,
          path: path,
          method: method,
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode || 500,
                data: data ? JSON.parse(data) : null
              });
            } catch (error) {
              resolve({
                status: res.statusCode || 500,
                data: null
              });
            }
          });
        });

        req.on('error', (error) => {
          console.error('Request error:', error);
          reject(error);
        });

        if (body) {
          req.write(JSON.stringify(body));
        }
        req.end();
      });
    }

    // Test 1: Publish a record via API
    console.log('Test 1: Publishing a record via API...');
    const record = {
      type: 'data' as const,
      content: { message: 'Hello from API!' },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false },
      pinned: true
    };

    const publishResponse = await makeRequest('POST', '/publish', record);
    console.log('Publish response:', {
      status: publishResponse.status,
      data: publishResponse.data
    });

    const publishedCid = publishResponse.data?.cid;

    // Test 2: Fetch the published record
    console.log('\nTest 2: Fetching the published record...');
    const fetchResponse = await makeRequest('GET', `/fetch/${publishedCid}/private`);
    console.log('Fetch response:', {
      status: fetchResponse.status,
      data: fetchResponse.data
    });

    // Verify content matches
    const contentMatches = JSON.stringify(fetchResponse.data?.content) === JSON.stringify(record.content);
    console.log('Content matches original:', contentMatches);

    // Test 3: Get node status
    console.log('\nTest 3: Getting node status...');
    const statusResponse = await makeRequest('GET', '/status');
    console.log('Status response:', {
      status: statusResponse.status,
      data: statusResponse.data
    });

    // Test 4: Pin the record
    console.log('\nTest 4: Pinning the record...');
    const pinResponse = await makeRequest('POST', `/pin/${publishedCid}/private`);
    console.log('Pin response:', {
      status: pinResponse.status,
      data: pinResponse.data
    });

    // Test 5: Get pinned CIDs
    console.log('\nTest 5: Getting pinned CIDs...');
    const pinnedResponse = await makeRequest('GET', '/pins/private');
    console.log('Pinned CIDs response:', {
      status: pinnedResponse.status,
      data: pinnedResponse.data
    });

    // Verify the published CID is in the pinned list
    const isPinned = pinnedResponse.data?.includes(publishedCid);
    console.log('Published CID is pinned:', isPinned);

    // Test 6: Publish a bundle
    console.log('\nTest 6: Publishing a bundle...');
    const bundle = {
      schemaRecord: {
        type: 'schema' as const,
        content: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        },
        scope: 'private' as const,
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false },
        pinned: true
      },
      dataRecord: {
        type: 'data' as const,
        content: { name: 'Test Bundle' },
        scope: 'private' as const,
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false },
        pinned: true
      },
      combinedScope: 'private',
      timestamp: new Date().toISOString()
    };

    const bundleResponse = await makeRequest('POST', '/publish/bundle', bundle);
    console.log('Bundle publish response:', {
      status: bundleResponse.status,
      data: bundleResponse.data
    });

    // Test 7: Error handling
    console.log('\nTest 7: Testing error handling...');
    
    // Invalid CID
    const invalidFetchResponse = await makeRequest('GET', '/fetch/invalid-cid/private');
    console.log('Invalid CID fetch response:', {
      status: invalidFetchResponse.status,
      error: invalidFetchResponse.data
    });

    // Invalid scope
    const invalidScopeResponse = await makeRequest('GET', `/fetch/${publishedCid}/invalid`);
    console.log('Invalid scope fetch response:', {
      status: invalidScopeResponse.status,
      error: invalidScopeResponse.data
    });

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    try {
      if (server) {
        server.close();
      }
      await pipe.stop();
      console.log('\nTest completed, server stopped, and node stopped.');
    } catch (error) {
      console.error('Error stopping server/node:', error);
    }
  }
}

// Run the test
(async () => {
  try {
    await testApi();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})(); 