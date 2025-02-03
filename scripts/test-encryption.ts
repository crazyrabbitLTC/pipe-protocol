import { PipeProtocol } from '../src/pipe';

async function testEncryption() {
  console.log('Starting encryption test...\n');
  
  const pipe = new PipeProtocol({});

  try {
    // Test 1: Publish an encrypted record
    console.log('Test 1: Publishing an encrypted record...');
    const record = {
      type: 'data' as const,
      content: { secretMessage: 'This is a secret!' },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: true },
      encryption: { 
        enabled: true,
        method: 'AES-GCM',
        keyRef: 'test-key'
      }
    };

    const published = await pipe.publishRecord(record);
    console.log('Published encrypted record:', {
      cid: published.cid,
      content: published.content,
      encryption: published.encryption
    });

    // Test 2: Fetch and verify the encrypted record
    console.log('\nTest 2: Fetching the encrypted record...');
    if (published.cid) {
      const fetched = await pipe.fetchRecord(published.cid, 'private');
      console.log('Fetched encrypted record:', {
        content: fetched?.content,
        encryption: fetched?.encryption
      });

      // Note: In a real implementation, we would decrypt here
      console.log('Note: Content is encrypted and would need decryption');
    }

    // Test 3: Publish a record with different encryption settings
    console.log('\nTest 3: Publishing with different encryption settings...');
    const record2 = {
      ...record,
      encryption: {
        enabled: true,
        method: 'ChaCha20',
        keyRef: 'different-key'
      }
    };

    const published2 = await pipe.publishRecord(record2);
    console.log('Published second encrypted record:', {
      cid: published2.cid,
      content: published2.content,
      encryption: published2.encryption
    });

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await pipe.stop();
    console.log('\nTest completed and node stopped.');
  }
}

testEncryption().catch(console.error); 