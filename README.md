# Pipe Protocol

A protocol for wrapping LLM tools with IPFS storage, encryption, and schema generation capabilities.

## Features

- 🔄 Store tool inputs and outputs on IPFS with content-addressable storage
- 📊 Automatic schema generation and validation for stored data
- 🔒 Multiple storage scopes (private/public/machine/user)
- 🎯 Token counting and limiting for LLM context management
- 📌 Configurable pinning options for data persistence
- 🔐 Built-in encryption support with flexible access policies
- 🪝 Pre and post-store hooks for custom data processing
- 🛠️ Tool wrapping with enhanced capabilities
- 📦 Bundle support for schema and data pairing

## Installation

```bash
npm install pipe-protocol
```

## Quick Start

```typescript
import { Pipe } from 'pipe-protocol';
import type { Tool } from 'pipe-protocol/types';

// Initialize Pipe
const pipe = new Pipe();

// Define your tool
const myTool: Tool = {
  name: 'example',
  description: 'An example tool',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  call: async (args: { input: string }) => {
    return { result: args.input };
  }
};

// Wrap your tool
const [wrappedTool] = pipe.wrap([myTool]);

// Use the wrapped tool
const result = await wrappedTool.call({
  input: 'test',
  pipeOptions: {
    scope: 'private',
    generateSchema: true,
    pin: true
  }
});

console.log(result);
// {
//   result: 'test',
//   cid: 'Qm...',
//   schemaCid: 'Qm...',
//   metadata: {
//     tool: 'example',
//     truncated: false,
//     pinned: true,
//     scope: 'private'
//   }
// }
```

## Core Concepts

### Records and Bundles

```typescript
// Create and publish a record
const record: PipeRecord = {
  type: 'data',
  content: { message: 'Hello, World!' },
  scope: 'private',
  accessPolicy: { hiddenFromLLM: false }
};

const published = await pipe.publishRecord(record);

// Create and publish a bundle (data + schema)
const bundle: PipeBundle = {
  schemaRecord: {
    type: 'schema',
    content: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    },
    scope: 'private'
  },
  dataRecord: record,
  combinedScope: 'private'
};

const publishedBundle = await pipe.publishBundle(bundle);
```

### Storage Scopes

- `private`: Data accessible only within the local context
- `public`: Data that can be shared and replicated across nodes
- `machine`: Data specific to the current machine/environment
- `user`: Data specific to the current user

```typescript
// Replicate data between scopes
await pipe.replicate(cid, 'private', 'public');
```

### Token Management

```typescript
const pipe = new Pipe({
  defaults: {
    maxTokens: 1000,
    storeResult: true
  }
});

// Results exceeding maxTokens will be truncated
// and marked in metadata: { truncated: true }
```

### Access Policies

```typescript
const record: PipeRecord = {
  type: 'data',
  content: { sensitive: 'data' },
  scope: 'private',
  accessPolicy: {
    hiddenFromLLM: true,
    allowedTools: ['specificTool']
  }
};
```

### Hook System

```typescript
pipe.addHooks([
  {
    name: 'preprocessor',
    type: 'beforeStore',
    handler: async (data) => {
      // Process data before storage
      return processedData;
    }
  }
]);
```

## Configuration

```typescript
const pipe = new Pipe({
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

# Run specific test suites
npm run test:llm-wrapping
npm run test:basic
npm run test:ipfs
```

## API Documentation

For detailed API documentation, visit our [documentation site](https://pipe-protocol.github.io/docs).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your PR:
- Includes tests for new functionality
- Maintains or improves code coverage
- Follows the existing code style
- Updates documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 