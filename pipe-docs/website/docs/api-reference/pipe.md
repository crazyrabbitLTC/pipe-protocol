---
sidebar_position: 1
---

# Pipe Class

The main class for managing tool wrapping and IPFS integration.

## Constructor

```typescript
constructor(config?: PipeConfig)
```

Creates a new instance of the Pipe class.

### Parameters

- `config` (optional): Configuration object with the following structure:
  ```typescript
  interface PipeConfig {
    ipfs?: {
      endpoint?: string;     // IPFS node endpoint
      timeout?: number;      // Request timeout in ms
      scope?: 'public' | 'private';  // Default scope
      pin?: boolean;        // Default pin setting
    };
    defaults?: {
      maxTokens?: number;          // Token limit
      storeResult?: boolean;       // Store in IPFS
      generateSchema?: boolean;    // Generate schemas
      scope?: 'public' | 'private'; // Storage scope
      pin?: boolean;              // Pin data
    };
  }
  ```

### Default Values

```typescript
{
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
}
```

## Methods

### wrap

```typescript
wrap(tools: Tool[]): Tool[]
```

Wraps tools with IPFS storage capabilities.

#### Parameters

- `tools`: Array of tools to wrap. Each tool must implement the `Tool` interface:
  ```typescript
  interface Tool {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
    call: (args: unknown) => Promise<unknown>;
  }
  ```

#### Returns

Array of wrapped tools with enhanced functionality.

### store

```typescript
store(data: unknown, options?: StoreOptions): Promise<string>
```

Stores data in IPFS.

#### Parameters

- `data`: Data to store
- `options` (optional):
  ```typescript
  interface StoreOptions {
    pin?: boolean;
    scope?: 'public' | 'private';
  }
  ```

#### Returns

Promise resolving to the IPFS CID of the stored data.

### retrieve

```typescript
retrieve(cid: string): Promise<unknown>
```

Retrieves data from IPFS.

#### Parameters

- `cid`: IPFS Content Identifier

#### Returns

Promise resolving to the retrieved data.

### addHooks

```typescript
addHooks(hooks: Hook[]): void
```

Adds processing hooks.

#### Parameters

- `hooks`: Array of hooks to add:
  ```typescript
  interface Hook {
    name: string;
    type: 'beforeStore' | 'afterStore';
    handler: (data: unknown) => unknown | Promise<unknown>;
  }
  ```

### removeHook

```typescript
removeHook(name: string): void
```

Removes a hook by name.

#### Parameters

- `name`: Name of the hook to remove

## Examples

### Basic Usage

```typescript
const pipe = new Pipe();

const tools = pipe.wrap([{
  name: 'example',
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

const result = await tools[0].call({
  input: 'test'
});
```

### Using Hooks

```typescript
pipe.addHooks([
  {
    name: 'logger',
    type: 'beforeStore',
    handler: async (data) => {
      console.log('Storing:', data);
      return data;
    }
  }
]);

pipe.removeHook('logger');
```

### Direct Storage

```typescript
const cid = await pipe.store(
  { data: 'test' },
  { scope: 'public', pin: true }
);

const data = await pipe.retrieve(cid);
``` 