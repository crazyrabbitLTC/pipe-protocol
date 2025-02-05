---
sidebar_position: 1
---

# Installation

Getting started with Pipe Protocol is straightforward. Follow these steps to install and set up the protocol in your project.

## Prerequisites

Before installing Pipe Protocol, ensure you have:
- Node.js (version 18 or higher)
- npm or yarn package manager

## Installation Steps

1. Install the package using npm:

```bash
npm install pipe-protocol
```

Or using yarn:

```bash
yarn add pipe-protocol
```

2. Import the package in your code:

```typescript
import { Pipe } from 'pipe-protocol';
```

3. Initialize the Pipe instance:

```typescript
const pipe = new Pipe();
```

## Configuration

The Pipe Protocol can be configured with various options:

```typescript
const pipe = new Pipe({
  // Add your configuration options here
});
```

## Next Steps

Now that you have Pipe Protocol installed, check out our [Basic Usage Guide](../guides/basic-usage) to learn how to use it effectively. 