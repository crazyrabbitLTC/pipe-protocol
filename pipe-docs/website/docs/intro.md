---
sidebar_position: 1
---

# Introduction

Pipe Protocol is a powerful tool for wrapping LLM tools with IPFS storage and schema generation capabilities. It provides a seamless way to store, manage, and retrieve tool inputs and outputs while maintaining data integrity and accessibility.

## Key Features

- **IPFS Integration**: Store tool inputs and outputs on IPFS with configurable options
- **Schema Generation**: Automatically generate and store schemas for your data
- **Token Management**: Built-in token counting and limiting capabilities
- **Flexible Storage**: Configure storage scope (private/public) and pinning options
- **Extensible**: Pre and post-store hooks for custom data processing
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

## Why Pipe Protocol?

When working with LLM tools, managing inputs, outputs, and their metadata can become complex. Pipe Protocol simplifies this by providing:

- **Standardized Storage**: Consistent way to store and retrieve tool data
- **Schema Validation**: Automatic schema generation for data validation
- **Token Control**: Built-in token counting and limiting for LLM outputs
- **Flexible Configuration**: Customizable storage options and processing hooks
- **Developer-Friendly**: Clean, type-safe APIs with comprehensive documentation

## Quick Example

```typescript
import { Pipe } from 'pipe-protocol';

// Initialize with default configuration
const pipe = new Pipe();

// Wrap your tools
const tools = pipe.wrap([{
  name: 'myTool',
  description: 'Example tool',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  call: async (args) => {
    return { result: args.input };
  }
}]);

// Use the wrapped tool
const result = await tools[0].call({
  input: 'test'
});

// Result includes IPFS CID and metadata
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

## Next Steps

- [Getting Started](getting-started/installation.md) - Install and set up Pipe Protocol
- [Basic Usage](guides/basic-usage.md) - Learn the basics of using Pipe Protocol
- [Configuration](guides/configuration.md) - Configure Pipe Protocol for your needs
- [API Reference](api-reference/pipe.md) - Detailed API documentation 