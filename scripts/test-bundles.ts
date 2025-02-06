import { PipeProtocol } from '../src/pipe';
import { PipeBundle } from '../src/types';

async function testBundles() {
  console.log('Starting bundles test...\n');
  
  const pipe = new PipeProtocol({});

  try {
    // Test 1: Create and publish a bundle with schema and data
    console.log('Test 1: Publishing a bundle with schema and data...');
    const bundle: PipeBundle = {
      schemaRecord: {
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
        encryption: { enabled: false },
        pinned: true
      },
      dataRecord: {
        type: 'data' as const,
        content: {
          name: 'John Doe',
          age: 30
        },
        scope: 'private' as const,
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false },
        pinned: true
      },
      combinedScope: 'private',
      timestamp: new Date().toISOString()
    };

    const published = await pipe.publishBundle(bundle);
    console.log('Published bundle:', {
      schemaRecord: {
        cid: published.schemaRecord.cid,
        content: published.schemaRecord.content
      },
      dataRecord: {
        cid: published.dataRecord.cid,
        content: published.dataRecord.content
      },
      timestamp: published.timestamp
    });

    // Test 2: Fetch and verify bundle records
    console.log('\nTest 2: Fetching bundle records...');
    if (published.schemaRecord.cid && published.dataRecord.cid) {
      const fetchedSchema = await pipe.fetchRecord(published.schemaRecord.cid, 'private');
      const fetchedData = await pipe.fetchRecord(published.dataRecord.cid, 'private');

      console.log('Fetched schema record:', {
        content: fetchedSchema?.content,
        type: fetchedSchema?.type
      });

      console.log('Fetched data record:', {
        content: fetchedData?.content,
        type: fetchedData?.type
      });

      // Verify content matches
      const schemaMatches = JSON.stringify(fetchedSchema?.content) === JSON.stringify(bundle.schemaRecord.content);
      const dataMatches = JSON.stringify(fetchedData?.content) === JSON.stringify(bundle.dataRecord.content);
      console.log('Content matches original:', {
        schema: schemaMatches,
        data: dataMatches
      });
    }

    // Test 3: Create and publish an encrypted bundle
    console.log('\nTest 3: Publishing an encrypted bundle...');
    const encryptedBundle: PipeBundle = {
      schemaRecord: {
        type: 'schema' as const,
        content: {
          type: 'object',
          properties: {
            secretKey: { type: 'string' },
            value: { type: 'string' }
          },
          required: ['secretKey', 'value']
        },
        scope: 'private' as const,
        accessPolicy: { hiddenFromLLM: true },
        encryption: {
          enabled: true,
          algorithm: 'AES-GCM',
          key: 'test-key'
        },
        pinned: true
      },
      dataRecord: {
        type: 'data' as const,
        content: {
          secretKey: 'super-secret',
          value: 'classified-data'
        },
        scope: 'private' as const,
        accessPolicy: { hiddenFromLLM: true },
        encryption: {
          enabled: true,
          algorithm: 'AES-GCM',
          key: 'test-key'
        },
        pinned: true
      },
      combinedScope: 'private',
      timestamp: new Date().toISOString()
    };

    const publishedEncrypted = await pipe.publishBundle(encryptedBundle);
    console.log('Published encrypted bundle:', {
      schemaRecord: {
        cid: publishedEncrypted.schemaRecord.cid,
        encryption: publishedEncrypted.schemaRecord.encryption
      },
      dataRecord: {
        cid: publishedEncrypted.dataRecord.cid,
        encryption: publishedEncrypted.dataRecord.encryption
      }
    });

    // Test 4: Verify pinning of bundle records
    console.log('\nTest 4: Verifying pinned bundle records...');
    const pinnedCids = await pipe.getPinnedCids('private');
    
    const schemaPinned = published.schemaRecord.cid && pinnedCids.includes(published.schemaRecord.cid);
    const dataPinned = published.dataRecord.cid && pinnedCids.includes(published.dataRecord.cid);
    const encryptedSchemaPinned = publishedEncrypted.schemaRecord.cid && 
      pinnedCids.includes(publishedEncrypted.schemaRecord.cid);
    const encryptedDataPinned = publishedEncrypted.dataRecord.cid && 
      pinnedCids.includes(publishedEncrypted.dataRecord.cid);

    console.log('Bundle records are pinned:', {
      plainSchema: schemaPinned,
      plainData: dataPinned,
      encryptedSchema: encryptedSchemaPinned,
      encryptedData: encryptedDataPinned
    });

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    try {
      await pipe.stop();
      console.log('\nTest completed and node stopped.');
    } catch (error) {
      console.error('Error stopping node:', error);
    }
  }
}

// Run the test
(async () => {
  try {
    await testBundles();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})(); 