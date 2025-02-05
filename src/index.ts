import { Pipe } from './pipe';
import { Tool } from './types';

export function pipe(tools: Tool[]) {
  const protocol = new Pipe({});
  return protocol.wrap(tools);
}

export { Pipe };
export { IpfsClient } from './ipfsClient';
export * from './types';
export * from './schema';

// Export the example summary hook
export { summaryHook } from './pipe'; 