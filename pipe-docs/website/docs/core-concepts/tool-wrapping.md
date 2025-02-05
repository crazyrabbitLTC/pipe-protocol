---
sidebar_position: 1
---

# Tool Wrapping

Tool wrapping is a core concept in Pipe Protocol that enables existing tools to work with IPFS storage. When you wrap a tool, you enhance it with additional capabilities while preserving its original functionality.

## What is Tool Wrapping?

Tool wrapping is the process of taking an existing LLM tool and adding IPFS storage capabilities to it. The wrapped tool can:
- Store its results in IPFS automatically
- Generate and store schemas for its data
- Apply token limits to its output
- Execute pre and post-store hooks

## Tool Interface

Each tool should follow this interface:

```typescript
interface Tool {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    returns?: {
        type: string;
        description?: string;
    };
    call: (...args: any[]) => any;
}
```

## How to Wrap a Tool

Here's a basic example of wrapping a tool:

```typescript
import { Pipe } from 'pipe-protocol';

// Define your tool
const myTool = {
    name: 'addNumbers',
    description: 'Adds two numbers together',
    parameters: {
        type: 'object',
        properties: {
            num1: { type: 'number', description: 'First number' },
            num2: { type: 'number', description: 'Second number' }
        },
        required: ['num1', 'num2']
    },
    call: async (args: { num1: number; num2: number }) => {
        return { result: args.num1 + args.num2 };
    }
};

// Initialize Pipe
const pipe = new Pipe();

// Wrap your tool
const wrappedTool = pipe.wrap([myTool])[0];
```

## Using Wrapped Tools

When you use a wrapped tool, you get additional metadata and storage capabilities:

```typescript
const result = await wrappedTool.call({ num1: 5, num2: 10 });

console.log(result);
// Output:
// {
//   result: 15,
//   cid: 'Qm...',
//   schemaCid: 'Qm...',
//   metadata: {
//     tool: 'addNumbers',
//     timestamp: '2024-07-05T10:00:00.000Z'
//   }
// }
```

## Benefits of Tool Wrapping

1. **Automatic Storage**: Results are automatically stored in IPFS
2. **Schema Generation**: JSON schemas are generated for your data
3. **Token Management**: Control token limits for LLM context
4. **Metadata**: Additional context about tool execution
5. **Hook System**: Customize data processing

## Best Practices

1. **Keep Tools Simple**: Each tool should do one thing well
2. **Clear Descriptions**: Provide clear descriptions for tools and parameters
3. **Type Safety**: Use TypeScript for better type safety
4. **Error Handling**: Handle errors gracefully in your tool's call function
5. **Documentation**: Document any special requirements or behaviors 