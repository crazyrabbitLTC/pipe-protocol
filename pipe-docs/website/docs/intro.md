---
sidebar_position: 1
---

# Introduction to Pipe Protocol

## What is Pipe?

Pipe is a powerful tool that simplifies data handling in applications that use Large Language Models (LLMs). It enables LLMs and their tools to share and manage data through IPFS (InterPlanetary File System). This improves context management, data sharing, and scalability in your applications.

## Key Problems Pipe Solves

### Context Overload
LLMs often suffer when large amounts of data are added to the context window, leading to performance drops or token limit issues.

### Data Duplication
Multiple agents or tools can redundantly store the same data.

### Data Sharing Inefficiency
Sharing large data objects directly in LLM prompts or API calls is slow and wasteful.

## How Pipe Solves These Problems

Pipe addresses these issues with a blend of several methods, using IPFS as the backbone for its data handling system:

### Content-Addressable Storage
Pipe stores data in IPFS, where each piece of data is assigned a unique Content Identifier (CID).

### Reference Passing
Instead of passing actual data, LLMs and tools exchange the immutable CID. This reduces context size and data duplication.

### Dynamic Schemas
The generateSchema function lets you dynamically generate JSON schemas based on data structures for storage and later retrieval.

### Hooks
Pipe supports hooks, which can be called before or after storage.

## Core Features

- **IPFS Storage**: Store your LLM tool inputs and outputs on IPFS with configurable storage scopes and pinning options.
- **Schema Generation**: Automatically generate and store JSON schemas for your data.
- **Token Management**: Built-in token counting and limiting capabilities.
- **Encryption Support**: Secure your sensitive data with built-in encryption.
- **Hook System**: Extend functionality with pre and post-store hooks.
- **Easy Integration**: Simple API for wrapping existing tools.

## Next Steps

Ready to get started with Pipe Protocol? Check out our:

- [Installation Guide](getting-started/installation) to set up Pipe in your project
- [Basic Usage Guide](getting-started/basic-usage) to learn the fundamentals
- [Core Concepts](core-concepts/tool-wrapping) to understand how Pipe works
- [API Reference](api-reference/pipe) for detailed documentation 