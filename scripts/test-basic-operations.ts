import { PipeProtocol } from '../src/pipe.js';
import type { Tool } from '../src/types.js';

async function testBasicOperations() {
  console.log('Starting basic operations test...\n');

  const pipe = new PipeProtocol({});

  try {
    // Test 1: Publish a record
    console.log('Test 1: Publishing a record...');
    const record = {
      type: 'data' as const,
      content: { message: 'Hello, World!' },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: false }
    };

    const published = await pipe.publishRecord(record);
    console.log('Published record CID:', published.cid);

    // Test 2: Fetch the record
    console.log('\nTest 2: Fetching the record...');
    const fetched = await pipe.fetchRecord(published.cid!, 'private');
    console.log('Fetched record content:', fetched?.content);

    // Test 3: Pin the record
    console.log('\nTest 3: Pinning the record...');
    await pipe.pin(published.cid!, 'private');
    console.log('Record pinned successfully');

    // Test 4: Check pinned CIDs
    console.log('\nTest 4: Checking pinned CIDs...');
    const pinnedCids = await pipe.getPinnedCids('private');
    console.log('Pinned CIDs:', pinnedCids);

    // Test 5: Unpin the record
    console.log('\nTest 5: Unpinning the record...');
    await pipe.unpin(published.cid!, 'private');
    console.log('Record unpinned successfully');

    // Test 6: Check node status
    console.log('\nTest 6: Checking node status...');
    const status = pipe.getStatus();
    console.log('Node status:', status);

    // Test 7: Get node info
    console.log('\nTest 7: Getting node info...');
    const info = pipe.getNodeInfo('private');
    console.log('Node info:', info);

    // Test 8: Get storage metrics
    console.log('\nTest 8: Getting storage metrics...');
    const metrics = await pipe.getStorageMetrics('private');
    console.log('Storage metrics:', metrics);

    // Test 9: Test tool wrapping
    console.log('\nTest 9: Testing tool wrapping...');
    const mockTool: Tool = {
      name: 'testTool',
      description: 'A test tool',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        }
      },
      call: async (args: any) => ({ result: args.input })
    };

    const wrappedTools = pipe.wrap([mockTool]);
    console.log('Tool wrapped successfully');

    // Test 10: Execute wrapped tool
    console.log('\nTest 10: Executing wrapped tool...');
    const toolResult = await wrappedTools[0].execute({ input: 'test' });
    console.log('Tool execution result:', toolResult);

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during tests:', error);
    process.exit(1);
  } finally {
    await pipe.stop();
  }
}

testBasicOperations().catch(console.error); 
