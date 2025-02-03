import { PipeProtocol } from '../src/pipe';

async function testBundles() {
  console.log('Starting bundle operations test...\n');
  
  const pipe = new PipeProtocol({});

  try {
    // Test 1: Create and publish a bundle
    console.log('Test 1: Publishing a bundle...');
    const schemaRecord = {
      type: 'schema' as const,
      content: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name', 'age']
      },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false }
    };

    const dataRecord = {
      type: 'data' as const,
      content: {
        name: 'John Doe',
        age: 30
      },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false }
    };

    const bundle = {
      schemaRecord,
      dataRecord,
      combinedScope: 'private' as const,
      timestamp: new Date().toISOString()
    };

    const published = await pipe.publishBundle(bundle);
    console.log('Published bundle:', {
      schemaRecordCid: published.schemaRecord.cid,
      dataRecordCid: published.dataRecord.cid,
      timestamp: published.timestamp
    });

    // Test 2: Fetch both records from the bundle
    console.log('\nTest 2: Fetching records from the bundle...');
    if (published.schemaRecord.cid && published.dataRecord.cid) {
      const fetchedSchema = await pipe.fetchRecord(published.schemaRecord.cid, 'private');
      const fetchedData = await pipe.fetchRecord(published.dataRecord.cid, 'private');

      console.log('Fetched schema:', fetchedSchema?.content);
      console.log('Fetched data:', fetchedData?.content);

      // Verify content matches
      const schemaMatches = JSON.stringify(fetchedSchema?.content) === JSON.stringify(schemaRecord.content);
      const dataMatches = JSON.stringify(fetchedData?.content) === JSON.stringify(dataRecord.content);
      
      console.log('\nContent verification:');
      console.log('Schema matches:', schemaMatches);
      console.log('Data matches:', dataMatches);
    }

    // Test 3: Pin the entire bundle
    console.log('\nTest 3: Pinning the bundle records...');
    if (published.schemaRecord.cid && published.dataRecord.cid) {
      await pipe.pin(published.schemaRecord.cid, 'private');
      await pipe.pin(published.dataRecord.cid, 'private');
      console.log('Bundle records pinned successfully');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await pipe.stop();
    console.log('\nTest completed and node stopped.');
  }
}

testBundles().catch(console.error); 