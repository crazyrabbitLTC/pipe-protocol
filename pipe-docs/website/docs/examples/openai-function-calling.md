---
sidebar_position: 1
---

# OpenAI Function Calling

This example demonstrates how to use Pipe Protocol with OpenAI's function calling feature. We'll create a simple Fibonacci sequence generator and show how Pipe automatically handles IPFS storage, schema generation, and result retrieval.

## Prerequisites

- Node.js 16 or later
- OpenAI API key
- Pipe Protocol installed (`npm install pipe-protocol`)

## Complete Example

Here's a complete example that shows:
- Defining a tool (Fibonacci sequence generator)
- Wrapping it with Pipe
- Using it with OpenAI's function calling
- Storing and retrieving results from IPFS

```typescript
import OpenAI from 'openai';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Pipe } from 'pipe-protocol';
import { Tool } from 'pipe-protocol/types';

// Initialize OpenAI and Pipe
const openai = new OpenAI();
const pipe = new Pipe();

// Fibonacci function that generates a sequence up to n
function generateFibonacci(n: number): number[] {
  if (n < 2) {
    throw new Error('Number must be at least 2');
  }
  const sequence: number[] = [0, 1];
  while (sequence.length < n) {
    sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2]);
  }
  return sequence;
}

// Define our tool
const fibonacciTool: Tool = {
  name: 'generate_fibonacci',
  description: 'Generate a Fibonacci sequence up to n numbers (minimum 2)',
  parameters: {
    type: 'object' as const,
    properties: {
      n: {
        type: 'number',
        description: 'Number of Fibonacci numbers to generate (must be 2 or greater)'
      }
    },
    required: ['n']
  },
  call: async (args: { n: number }) => {
    console.log(`Generating ${args.n} Fibonacci numbers...`);
    return generateFibonacci(args.n);
  }
};

// Wrap the tool with Pipe
const wrappedTools = pipe.wrap([fibonacciTool]);

async function main() {
  try {
    // Define the OpenAI tools schema
    const tools: ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'generate_fibonacci',
          description: 'Generate a Fibonacci sequence up to n numbers (minimum 2)',
          parameters: {
            type: 'object',
            properties: {
              n: {
                type: 'number',
                description: 'Number of Fibonacci numbers to generate (must be 2 or greater)'
              }
            },
            required: ['n']
          }
        }
      }
    ];

    const initialMessage: ChatCompletionMessageParam = { 
      role: 'user', 
      content: 'Can you generate the first 10 numbers of the Fibonacci sequence?' 
    };

    // First OpenAI call to get function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [initialMessage],
      tools
    });

    const toolCalls = completion.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log('No tool calls made');
      return;
    }

    // Execute the wrapped tool and get the enhanced result with IPFS storage
    const toolCall = toolCalls[0];
    const args = JSON.parse(toolCall.function.arguments);
    const wrappedResult = await wrappedTools[0].call(args);

    // Create the messages array with proper typing
    const messages: ChatCompletionMessageParam[] = [
      initialMessage,
      {
        role: 'assistant',
        content: 'I will help you generate the Fibonacci sequence.',
        tool_calls: toolCalls
      },
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(wrappedResult)
      }
    ];

    // Final OpenAI call to get the formatted response
    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      tools
    });

    console.log('\nFinal Response:', finalCompletion.choices[0].message.content);
    console.log('\nPipe Enhanced Result:');
    console.log('- IPFS CID:', wrappedResult.cid);
    console.log('- Metadata:', wrappedResult.metadata);

    // Fetch and display the content from IPFS
    const storedContent = await pipe.retrieve(wrappedResult.cid);
    console.log('Content stored in IPFS:', storedContent);

    // Also fetch and display the schema if available
    if (wrappedResult.schemaCid) {
      const storedSchema = await pipe.retrieve(wrappedResult.schemaCid);
      console.log('Schema stored in IPFS:', storedSchema);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main();
```

## Example Output

When you run this example, you'll see output similar to this:

```
Sending request to OpenAI...
OpenAI decided to call our tool...
Executing wrapped tool with args: { n: 10 }
Generating 10 Fibonacci numbers...

Final Response: Here are the first 10 numbers of the Fibonacci sequence:
0, 1, 1, 2, 3, 5, 8, 13, 21, 34

Pipe Enhanced Result:
- IPFS CID: QmWzAsMSwxLDIsMyw1LDgsMTMsMjEsMzRd
- Metadata: {
  tool: "generate_fibonacci",
  truncated: false,
  pinned: true,
  scope: "private"
}

Content stored in IPFS: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

Schema stored in IPFS: {
  type: "array",
  items: {
    type: "number"
  }
}
```

## Key Features Demonstrated

1. **Tool Wrapping**: The example shows how to wrap a simple tool with Pipe, making it automatically store results in IPFS.

2. **OpenAI Integration**: Demonstrates how to use Pipe with OpenAI's function calling feature, including:
   - Proper tool schema definition
   - Handling function calls
   - Processing results

3. **IPFS Storage**: Shows how Pipe automatically:
   - Stores the tool's output in IPFS
   - Generates and stores a schema
   - Provides easy retrieval of both data and schema

4. **Metadata Tracking**: Each result includes metadata about:
   - Which tool generated it
   - Whether the result was truncated
   - Storage scope (private/public)
   - Pinning status

## Next Steps

- Learn about [configuring storage options](../guides/configuration.md)
- Explore [more examples](./index.md)
- Read about [schema generation](../concepts/schema-generation.md) 