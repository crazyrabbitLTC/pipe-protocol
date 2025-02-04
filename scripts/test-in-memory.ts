import { InMemoryIpfsNode } from '../src/inMemoryIpfs'

async function main() {
  const node = new InMemoryIpfsNode()
  
  try {
    console.log('Initializing IPFS node...')
    await node.init()
    
    const testData = new TextEncoder().encode('Hello, IPFS!')
    console.log('Adding data to IPFS...')
    const cid = await node.add(testData)
    console.log('Data added with CID:', cid)
    
    console.log('Retrieving data from IPFS...')
    const retrievedData = await node.get(cid)
    const decodedData = new TextDecoder().decode(retrievedData)
    console.log('Retrieved data:', decodedData)
    
    if (decodedData === 'Hello, IPFS!') {
      console.log('Test successful! Data matches.')
    } else {
      console.error('Test failed! Data does not match.')
    }
  } catch (error) {
    console.error('Test failed with error:', error)
  } finally {
    console.log('Stopping IPFS node...')
    await node.stop()
  }
}

main().catch(console.error) 