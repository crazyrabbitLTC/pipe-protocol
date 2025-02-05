---
sidebar_position: 1
---

# Pipe API Reference

This page provides detailed information about the Pipe Protocol API.

## Pipe Class

The main class for interacting with the Pipe Protocol.

### Constructor

```typescript
constructor(config?: PipeConfig)
```

#### Parameters

- `config` (optional): Configuration options for the Pipe instance
  - `ipfsConfig`: IPFS configuration options
  - `encryptionConfig`: Encryption configuration options

### Methods

#### wrap

Wraps one or more tools with IPFS storage capabilities.

```typescript
wrap(tools: Tool[]): WrappedTool[]
```

##### Parameters

- `tools`: An array of tools to wrap

##### Returns

An array of wrapped tools with IPFS storage capabilities

#### retrieve

Retrieves content from IPFS using a CID.

```typescript
retrieve(cid: string): Promise<any>
```

##### Parameters

- `cid`: The IPFS Content Identifier

##### Returns

A promise that resolves to the content stored at the given CID

## Types

### Tool

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  call: (args: any) => Promise<any>;
}
```

### WrappedTool

```typescript
interface WrappedTool extends Tool {
  cid?: string;
  schemaCid?: string;
  metadata?: Record<string, any>;
}
```

## Error Handling

The Pipe Protocol throws specific errors in various situations:

- `PipeError`: Base error class for all Pipe-related errors
- `IPFSError`: Thrown when IPFS operations fail
- `EncryptionError`: Thrown when encryption/decryption operations fail
- `ValidationError`: Thrown when input validation fails