import { PipeProtocol } from './pipe';
import { PipeRecord, PipeBundle, Scope, Tool } from './types';

interface PipeTool {
  name: string;
  description: string;
  call: (method: string, args: any) => Promise<PipeRecord | PipeBundle | null | void>;
}

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