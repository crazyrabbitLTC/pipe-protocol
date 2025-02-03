import { PipeProtocol } from '../src/pipe.js';

async function testReplication() {
  console.log('Starting replication test...\n');
  
  const pipe = new PipeProtocol({
    publicNodeEndpoint: 'https://ipfs.infura.io:5001'
  });

  try {
    // Test 1: Publish a record to private scope
    console.log('Test 1: Publishing a record to private scope...');
    const privateRecord = {
      type: 'data' as const,
      content: { message: 'Private data' },
      scope: 'private' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false },
      pinned: true
    };

    const publishedPrivate = await pipe.publishRecord(privateRecord);
    console.log('Published private record:', {
      cid: publishedPrivate.cid,
      scope: publishedPrivate.scope
    });

    // Test 2: Replicate to public scope
    console.log('\nTest 2: Replicating to public scope...');
    if (publishedPrivate.cid) {
      await pipe.replicate(publishedPrivate.cid, 'private', 'public');
      console.log('Record replicated to public scope');
    }

    // Test 3: Verify record is accessible in both scopes
    console.log('\nTest 3: Verifying record accessibility...');
    if (publishedPrivate.cid) {
      const privateAccess = await pipe.fetchRecord(publishedPrivate.cid, 'private');
      const publicAccess = await pipe.fetchRecord(publishedPrivate.cid, 'public');

      console.log('Record accessibility:', {
        privateScope: Boolean(privateAccess),
        publicScope: Boolean(publicAccess)
      });
    }

    // Test 4: Test machine scope
    console.log('\nTest 4: Testing machine scope...');
    const machineRecord = {
      type: 'data' as const,
      content: { message: 'Machine-specific data' },
      scope: 'machine' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false },
      pinned: true
    };

    const publishedMachine = await pipe.publishRecord(machineRecord);
    console.log('Published machine record:', {
      cid: publishedMachine.cid,
      scope: publishedMachine.scope
    });

    // Test 5: Test user scope
    console.log('\nTest 5: Testing user scope...');
    const userRecord = {
      type: 'data' as const,
      content: { message: 'User-specific data' },
      scope: 'user' as const,
      accessPolicy: { hiddenFromLLM: false },
      encryption: { enabled: false },
      pinned: true
    };

    const publishedUser = await pipe.publishRecord(userRecord);
    console.log('Published user record:', {
      cid: publishedUser.cid,
      scope: publishedUser.scope
    });

    // Test 6: Verify pinning across scopes
    console.log('\nTest 6: Verifying pinning across scopes...');
    const privatePins = await pipe.getPinnedCids('private');
    const publicPins = await pipe.getPinnedCids('public');
    const machinePins = await pipe.getPinnedCids('machine');
    const userPins = await pipe.getPinnedCids('user');

    console.log('Pinned CIDs by scope:', {
      private: privatePins.length,
      public: publicPins.length,
      machine: machinePins.length,
      user: userPins.length
    });

    // Test 7: Test scope isolation
    console.log('\nTest 7: Testing scope isolation...');
    if (publishedMachine.cid && publishedUser.cid) {
      try {
        await pipe.fetchRecord(publishedMachine.cid, 'user');
        console.log('Warning: Machine record accessible from user scope');
      } catch (error) {
        console.log('Expected: Machine record not accessible from user scope');
      }

      try {
        await pipe.fetchRecord(publishedUser.cid, 'machine');
        console.log('Warning: User record accessible from machine scope');
      } catch (error) {
        console.log('Expected: User record not accessible from machine scope');
      }
    }

  } catch (error) {
    console.error('Error during test:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    try {
      await pipe.stop();
      console.log('\nTest completed and node stopped.');
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
    await testReplication();
  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
})(); 