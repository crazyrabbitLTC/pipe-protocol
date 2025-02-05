---
sidebar_position: 1
---

# Basic Usage

This guide will walk you through the basic usage of Pipe Protocol, showing you how to wrap tools and interact with the IPFS storage.

## Wrapping a Tool

Here's a simple example of wrapping a tool with Pipe Protocol:

```typescript
import { Pipe } from 'pipe-protocol';
import { Tool } from 'pipe-protocol/types';

// Initialize Pipe
const pipe = new Pipe();

// Define your tool
const myTool: Tool = {
  name: 'example_tool',
  description: 'A simple example tool',
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input string to process'
      }
    },
    required: ['input']
  },
  call: async (args: { input: string }) => {
    return `Processed: ${args.input}`;
  }
};

// Wrap the tool
const wrappedTools = pipe.wrap([myTool]);

// Use the wrapped tool
const result = await wrappedTools[0].call({ input: 'test' });
console.log(result);
```

## Retrieving Data from IPFS

After using a wrapped tool, you can retrieve the data from IPFS:

```typescript
// The result includes the IPFS CID
const storedContent = await pipe.retrieve(result.cid);
console.log('Content from IPFS:', storedContent);
```

## Working with Schemas

Pipe Protocol automatically handles schema storage:

```typescript
// Access the schema if available
if (result.schemaCid) {
  const storedSchema = await pipe.retrieve(result.schemaCid);
  console.log('Schema from IPFS:', storedSchema);
}
```

## Next Steps

For more advanced usage and API details, check out our [API Reference](../api-reference/pipe). 