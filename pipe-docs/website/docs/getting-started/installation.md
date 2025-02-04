---
sidebar_position: 1
---

# Installation

Get started with Pipe Protocol by installing the package and setting up your development environment.

## Prerequisites

- Node.js 16 or later
- npm 7 or later
- An IPFS node (optional, defaults to local mock storage for development)

## Installing the Package

Install Pipe Protocol using npm:

```bash
npm install pipe-protocol
```

Or using yarn:

```bash
yarn add pipe-protocol
```

## Basic Setup

1. Import the package:

```typescript
import { Pipe } from 'pipe-protocol';
```

2. Create a new instance:

```typescript
// With default configuration
const pipe = new Pipe();

// Or with custom configuration
const pipe = new Pipe({
  ipfs: {
    endpoint: 'http://localhost:5001', // Your IPFS node endpoint
    timeout: 30000,                    // Request timeout in ms
    scope: 'private',                  // Default storage scope
    pin: true                         // Whether to pin by default
  },
  defaults: {
    maxTokens: 1000,                  // Maximum tokens in results
    storeResult: true,                // Store results in IPFS
    generateSchema: true,             // Generate schemas for data
    scope: 'private',                 // Storage scope
    pin: true                         // Pin data in IPFS
  }
});
```

## IPFS Setup (Optional)

If you want to use a real IPFS node instead of the mock storage:

1. Install IPFS:
   - [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
   - [IPFS Command Line](https://docs.ipfs.tech/install/command-line/)

2. Start your IPFS daemon:

```bash
ipfs daemon
```

3. Configure Pipe Protocol to use your IPFS node:

```typescript
const pipe = new Pipe({
  ipfs: {
    endpoint: 'http://localhost:5001', // Your IPFS node endpoint
    timeout: 30000
  }
});
```

## Verification

Verify your installation by running a simple test:

```typescript
async function testSetup() {
  const pipe = new Pipe();
  
  // Store some test data
  const cid = await pipe.store({ test: 'data' });
  console.log('Data stored with CID:', cid);
  
  // Retrieve the data
  const data = await pipe.retrieve(cid);
  console.log('Retrieved data:', data);
}

testSetup().catch(console.error);
```

## Next Steps

- [Basic Usage](../guides/basic-usage.md) - Learn how to use Pipe Protocol
- [Configuration](../guides/configuration.md) - Learn about configuration options
- [API Reference](../api-reference/pipe.md) - Explore the API documentation
- [OpenAI Function Calling Example](../examples/openai-function-calling.md) - See a complete example using OpenAI's function calling 