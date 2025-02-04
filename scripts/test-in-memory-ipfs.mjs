import { InMemoryIpfsNode } from '../dist/inMemoryIpfs.js'

async function main() {
  console.log('Starting in-memory IPFS node test...')
  const node = new InMemoryIpfsNode()

  try {
    console.log('Initializing node...')
    await node.init()
    console.log('Node initialized successfully')

    const testData = new TextEncoder().encode('Hello, IPFS!')
    console.log('Adding test data...')
    const cid = await node.add(testData)
    console.log('Data added with CID:', cid)

    console.log('Retrieving data...')
    const retrievedData = await node.get(cid)
    const decodedData = new TextDecoder().decode(retrievedData)
    console.log('Retrieved data:', decodedData)

    if (decodedData === 'Hello, IPFS!') {
      console.log('✅ Test passed: Data matches')
    } else {
      console.error('❌ Test failed: Data does not match')
      console.error('Expected: Hello, IPFS!')
      console.error('Received:', decodedData)
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  } finally {
    console.log('Stopping node...')
    await node.stop()
    console.log('Node stopped')
  }
}

main().catch(console.error) 