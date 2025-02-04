"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipe_1 = require("../src/pipe");
async function testEncryption() {
    console.log('Starting encryption test...\n');
    const pipe = new pipe_1.PipeProtocol({});
    try {
        // Test 1: Publish an encrypted record
        console.log('Test 1: Publishing an encrypted record...');
        const record = {
            type: 'data',
            content: { secretMessage: 'This is a secret!' },
            scope: 'private',
            accessPolicy: { hiddenFromLLM: true },
            encryption: {
                enabled: true,
                method: 'AES-GCM',
                keyRef: 'testKey1'
            },
            pinned: true
        };
        const published = await pipe.publishRecord(record);
        console.log('Published encrypted record:', {
            cid: published.cid,
            content: published.content,
            encryption: published.encryption
        });
        // Verify the content is encrypted (should be different from original)
        const contentChanged = JSON.stringify(published.content) !== JSON.stringify(record.content);
        console.log('Content was encrypted (different from original):', contentChanged);
        // Test 2: Publish a record with different encryption settings
        console.log('\nTest 2: Publishing with different encryption settings...');
        const record2 = {
            type: 'data',
            content: { secretMessage: 'Another secret!' },
            scope: 'private',
            accessPolicy: { hiddenFromLLM: true },
            encryption: {
                enabled: true,
                method: 'AES-GCM',
                keyRef: 'testKey2'
            },
            pinned: true
        };
        const published2 = await pipe.publishRecord(record2);
        console.log('Published second encrypted record:', {
            cid: published2.cid,
            content: published2.content,
            encryption: published2.encryption
        });
        // Test 3: Verify different keys produce different ciphertexts
        console.log('\nTest 3: Verifying different keys produce different ciphertexts...');
        const differentCiphertexts = published.content !== published2.content;
        console.log('Different keys produced different ciphertexts:', differentCiphertexts);
        // Test 4: Publish an unencrypted record
        console.log('\nTest 4: Publishing an unencrypted record...');
        const record3 = {
            type: 'data',
            content: { publicMessage: 'This is public!' },
            scope: 'public',
            accessPolicy: { hiddenFromLLM: false },
            encryption: { enabled: false },
            pinned: true
        };
        const published3 = await pipe.publishRecord(record3);
        console.log('Published unencrypted record:', {
            cid: published3.cid,
            content: published3.content,
            encryption: published3.encryption
        });
        // Verify content matches (should be unchanged)
        const contentUnchanged = JSON.stringify(published3.content) === JSON.stringify(record3.content);
        console.log('Unencrypted content matches original:', contentUnchanged);
        // Test 5: Fetch and verify records
        console.log('\nTest 5: Fetching and verifying records...');
        if (published.cid && published2.cid && published3.cid) {
            // Fetch encrypted records
            const fetched1 = await pipe.fetchRecord(published.cid, 'private');
            const fetched2 = await pipe.fetchRecord(published2.cid, 'private');
            const fetched3 = await pipe.fetchRecord(published3.cid, 'public');
            console.log('Fetched records have encryption enabled:', {
                record1: fetched1?.encryption?.enabled,
                record2: fetched2?.encryption?.enabled,
                record3: fetched3?.encryption?.enabled
            });
            // Verify encryption settings are preserved
            const encryptionPreserved = fetched1?.encryption?.enabled === record.encryption.enabled &&
                fetched2?.encryption?.enabled === record2.encryption.enabled &&
                fetched3?.encryption?.enabled === record3.encryption.enabled;
            console.log('Encryption settings preserved:', encryptionPreserved);
        }
    }
    catch (error) {
        console.error('Error during test:', error);
    }
    finally {
        try {
            await pipe.stop();
            console.log('\nTest completed and node stopped.');
        }
        catch (error) {
            console.error('Error stopping node:', error);
        }
    }
}
// Run the test
(async () => {
    try {
        await testEncryption();
    }
    catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
})();
//# sourceMappingURL=test-encryption.js.map