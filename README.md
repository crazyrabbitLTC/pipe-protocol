# Pipe Protocol

A protocol for wrapping LLM tools with IPFS storage and schema generation capabilities.

## Features

- Store tool inputs and outputs on IPFS
- Automatic schema generation for stored data
- Token counting and limiting
- Configurable storage scopes (private/public)
- Configurable pinning options
- Pre and post-store hooks for data processing
- Tool wrapping with enhanced capabilities

## Installation

```bash
npm install pipe-protocol
```

## Quick Start

```typescript
import { Pipe } from 'pipe-protocol';

// Initialize with default configuration
const pipe = new Pipe();

// Or with custom configuration
const pipeWithConfig = new Pipe({
  ipfs: {
    endpoint: 'http://localhost:5001',
    timeout: 30000,
    scope: 'private',
    pin: true
  },
  defaults: {
    maxTokens: 1000,
    storeResult: true,
    generateSchema: true,
    scope: 'private',
    pin: true
  }
});

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
const result = await tools[0].call({
  input: 'test'
});

console.log(result);
// {
//   result: 'test',
//   cid: 'Qm...',
//   schemaCid: 'Qm...',
//   metadata: {
//     tool: 'myTool',
//     truncated: false,
//     pinned: true,
//     scope: 'private'
//   }
// }
```

## Configuration

### IPFS Configuration

```typescript
interface IPFSClientConfig {
  endpoint: string;    // IPFS node endpoint
  timeout: number;     // Request timeout in milliseconds
  scope: 'public' | 'private';  // Default storage scope
  pin: boolean;       // Whether to pin data by default
}
```

### Default Configuration

```typescript
interface PipeConfig {
  ipfs?: Partial<IPFSClientConfig>;
  defaults?: {
    maxTokens?: number;          // Maximum tokens allowed in results
    storeResult?: boolean;       // Whether to store results in IPFS
    generateSchema?: boolean;    // Whether to generate and store schemas
    scope?: 'public' | 'private'; // Storage scope
    pin?: boolean;              // Whether to pin data
  };
}
```

## Storage Scopes

- `private`: Data stored with restricted access
- `public`: Data stored with public access

## Token Counting and Limiting

The protocol automatically counts tokens in tool results and can enforce token limits:

```typescript
const pipe = new Pipe({
  defaults: {
    maxTokens: 100 // Limit results to 100 tokens
  }
});

// Results exceeding the token limit will be truncated
// and marked in the metadata: { truncated: true }
```

## Schema Generation

Schemas are automatically generated for stored data when enabled:

```typescript
const pipe = new Pipe({
  defaults: {
    generateSchema: true
  }
});

// The schema will be stored in IPFS and its CID
// will be included in the result as 'schemaCid'
```

## Hooks

Add pre and post-store processing:

```typescript
pipe.addHooks([
  {
    name: 'dataProcessor',
    type: 'beforeStore',
    handler: async (data) => {
      // Process data before storage
      return processedData;
    }
  },
  {
    name: 'notifier',
    type: 'afterStore',
    handler: async (data) => {
      // Handle data after storage
      notifyStorage(data);
      return data;
    }
  }
]);
```

## Direct IPFS Operations

You can also use IPFS operations directly:

```typescript
// Store data
const cid = await pipe.store(data, {
  pin: true,
  scope: 'public'
});

// Retrieve data
const retrieved = await pipe.retrieve(cid);
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