import { PipeProtocol } from './pipe';
import { Tool } from './types';

export function pipe(tools: Tool[]) {
  const protocol = new PipeProtocol({});
  return protocol.wrap(tools);
}

export { PipeProtocol };
export { IpfsClient } from './ipfsClient';
export * from './types';
export * from './schema';

// Export the example summary hook
export { summaryHook } from './pipe'; 