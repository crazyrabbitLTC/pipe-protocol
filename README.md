# Pipe Protocol

A protocol for wrapping LLM tools with IPFS storage and encryption capabilities.

## Features

- Store tool inputs and outputs on IPFS
- Automatic schema generation for stored data
- End-to-end encryption support
- Multiple storage scopes (private, public, machine, user)
- Pre and post-store hooks for data processing
- Tool wrapping with enhanced capabilities

## Installation

```bash
npm install pipe-protocol
```

## Quick Start

```typescript
import { PipeProtocol } from 'pipe-protocol';

// Initialize the protocol
const pipe = new PipeProtocol();

// Wrap your existing tools
const tools = pipe.wrap([
  {
    name: 'myTool',
    description: 'A sample tool',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string' }
      }
    },
    call: async (args) => {
      return { result: args.input };
    }
  }
]);

// Use the wrapped tool
const result = await tools[0].execute({
  input: 'test',
  pipeOptions: {
    scope: 'private',
    generateSchema: true,
    pin: true
  }
});

console.log(result);
// {
//   cid: 'Qm...',
//   schemaCid: 'Qm...',
//   description: 'A sample tool',
//   type: 'object',
//   metadata: { ... }
// }
```

## Storage Scopes

- `private`: Data stored locally, not shared
- `public`: Data stored on public IPFS network
- `machine`: Data stored locally, shared between processes
- `user`: Data stored locally, shared between users

## Encryption

Data can be encrypted before storage:

```typescript
const record = {
  content: { sensitive: 'data' },
  type: 'data',
  scope: 'private',
  accessPolicy: { hiddenFromLLM: false },
  encryption: { enabled: true }
};

const published = await pipe.publishRecord(record);
```

## Hooks

Add pre and post-store processing:

```typescript
pipe.addHook({
  name: 'summarizer',
  trigger: 'pre-store',
  handler: async (data, metadata) => {
    return {
      ...data,
      summary: generateSummary(data)
    };
  }
});
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 