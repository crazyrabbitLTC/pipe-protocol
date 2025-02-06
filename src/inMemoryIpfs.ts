import { IpfsNode } from './services/ipfs/ipfsNode';

export class InMemoryIpfsNode extends IpfsNode {
  constructor() {
    super({
      storage: 'memory',
      enableNetworking: false
    });
  }
} 