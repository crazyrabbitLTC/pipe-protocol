---
sidebar_position: 1
---

# Basic Usage

Learn how to use Pipe Protocol to wrap tools, store data, and manage results.

## Wrapping Tools

The primary use case of Pipe Protocol is wrapping tools with IPFS storage capabilities:

```typescript
import { Pipe } from 'pipe-protocol';

// Create a tool
const myTool = {
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
};

// Initialize Pipe
const pipe = new Pipe();

// Wrap the tool
const tools = pipe.wrap([myTool]);

// Use the wrapped tool
const result = await tools[0].call({
  input: 'test'
});
```

## Understanding Results

Wrapped tools return enhanced results that include:

```typescript
{
  // Original tool result
  result: 'test',
  
  // IPFS Content Identifiers
  cid: 'Qm...',        // CID of the result
  schemaCid: 'Qm...',  // CID of the schema (if enabled)
  
  // Metadata
  metadata: {
    tool: 'myTool',    // Name of the tool
    truncated: false,  // Whether result was truncated
    pinned: true,      // Whether data is pinned
    scope: 'private'   // Storage scope
  }
}
```

## Direct Storage Operations

You can also use IPFS storage directly:

```typescript
// Store data
const cid = await pipe.store(
  { myData: 'test' },
  {
    pin: true,
    scope: 'public'
  }
);

// Retrieve data
const data = await pipe.retrieve(cid);
```

## Using Hooks

Add processing hooks for pre and post-storage operations:

```typescript
// Add hooks
pipe.addHooks([
  {
    name: 'logger',
    type: 'beforeStore',
    handler: async (data) => {
      console.log('Storing data:', data);
      return data;
    }
  },
  {
    name: 'notifier',
    type: 'afterStore',
    handler: async (data) => {
      console.log('Stored data with CID:', data.cid);
      return data;
    }
  }
]);

// Remove a hook
pipe.removeHook('logger');
```

## Token Limiting

Control token count in results:

```typescript
const pipe = new Pipe({
  defaults: {
    maxTokens: 100 // Limit results to 100 tokens
  }
});

// Results exceeding the limit will be truncated
const result = await tools[0].call({
  input: 'very long input...'
});

// Check if truncated
console.log(result.metadata.truncated); // true if truncated
```

## Schema Generation

Enable automatic schema generation:

```typescript
const pipe = new Pipe({
  defaults: {
    generateSchema: true
  }
});

// The result will include a schema CID
const result = await tools[0].call({
  input: 'test'
});

// Retrieve the schema
const schema = await pipe.retrieve(result.schemaCid);
```

## Storage Scopes

Configure data accessibility:

```typescript
// Private scope (default)
const privatePipe = new Pipe({
  defaults: {
    scope: 'private'
  }
});

// Public scope
const publicPipe = new Pipe({
  defaults: {
    scope: 'public'
  }
});

// Or per operation
const result = await tools[0].call({
  input: 'test',
  pipeOptions: {
    scope: 'public'
  }
});
```

## Next Steps

- [Configuration](configuration.md) - Learn about advanced configuration options
- [API Reference](../api-reference/pipe.md) - Explore the complete API
- [Use Cases](../use-cases/llm-tools.md) - See real-world usage examples 