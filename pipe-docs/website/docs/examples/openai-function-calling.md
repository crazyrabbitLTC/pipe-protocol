---
sidebar_position: 1
---

# OpenAI Function Calling Example

This example demonstrates how to use Pipe Protocol with OpenAI's function calling feature and a custom tool that generates Fibonacci sequences.

## Setup

First, install the required dependencies:

```bash
npm install pipe-protocol openai
```

## Implementation

```typescript
import { Pipe } from 'pipe-protocol';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create a Fibonacci sequence generator tool
const fibonacciTool = {
  name: 'generateFibonacci',
  description: 'Generates a Fibonacci sequence up to a specified length',
  parameters: {
    type: 'object',
    properties: {
      length: {
        type: 'number',
        description: 'Length of the Fibonacci sequence to generate'
      }
    },
    required: ['length']
  },
  call: async (args: { length: number }) => {
    console.log(`Generating Fibonacci sequence of length ${args.length}...`);
    
    const sequence: number[] = [0, 1];
    while (sequence.length < args.length) {
      sequence.push(sequence[sequence.length - 1] + sequence[sequence.length - 2]);
    }
    
    return {
      sequence,
      length: sequence.length,
      lastNumber: sequence[sequence.length - 1]
    };
  }
};

// Initialize Pipe with token limiting and schema generation
const pipe = new Pipe({
  defaults: {
    maxTokens: 1000,
    generateSchema: true,
    storeResult: true,
    scope: 'private'
  }
});

// Wrap the Fibonacci tool
const wrappedTools = pipe.wrap([fibonacciTool]);
const wrappedFibTool = wrappedTools[0];

async function main() {
  try {
    // Example user request
    const userRequest = "Generate a Fibonacci sequence of 10 numbers and tell me about it.";
    console.log(`User request: ${userRequest}`);

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: userRequest
      }],
      functions: [fibonacciTool],
      function_call: "auto"
    });

    // Extract function call details
    const functionCall = completion.choices[0].message.function_call;
    
    if (functionCall && functionCall.name === 'generateFibonacci') {
      console.log('Function called by OpenAI:', functionCall.name);
      console.log('Arguments:', functionCall.arguments);

      // Parse arguments and call the wrapped tool
      const args = JSON.parse(functionCall.arguments || '{}');
      const result = await wrappedFibTool.call(args);

      console.log('\nResult from wrapped tool:');
      console.log('- Sequence:', result.sequence);
      console.log('- Length:', result.length);
      console.log('- Last number:', result.lastNumber);
      console.log('- IPFS CID:', result.cid);
      console.log('- Schema CID:', result.schemaCid);
      console.log('- Metadata:', result.metadata);

      // Retrieve the stored data and schema
      console.log('\nRetrieving data from IPFS...');
      const storedData = await pipe.retrieve(result.cid);
      console.log('Retrieved data:', storedData);

      if (result.schemaCid !== 'no-schema') {
        const schema = await pipe.retrieve(result.schemaCid);
        console.log('Retrieved schema:', schema);
      }

      // Get AI's response about the sequence
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: userRequest
          },
          {
            role: "assistant",
            content: null,
            function_call: functionCall
          },
          {
            role: "function",
            name: "generateFibonacci",
            content: JSON.stringify(result)
          }
        ]
      });

      console.log('\nAI Response:', finalResponse.choices[0].message.content);
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
User request: Generate a Fibonacci sequence of 10 numbers and tell me about it.

Function called by OpenAI: generateFibonacci
Arguments: {"length": 10}

Generating Fibonacci sequence of length 10...

Result from wrapped tool:
- Sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
- Length: 10
- Last number: 34
- IPFS CID: QmXJK7G8...
- Schema CID: QmYZ9H1P...
- Metadata: {
    tool: 'generateFibonacci',
    truncated: false,
    pinned: true,
    scope: 'private'
  }

Retrieving data from IPFS...
Retrieved data: {
  sequence: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34],
  length: 10,
  lastNumber: 34
}
Retrieved schema: {
  type: 'object',
  properties: {
    sequence: {
      type: 'array',
      items: { type: 'number' }
    },
    length: { type: 'number' },
    lastNumber: { type: 'number' }
  }
}

AI Response: I've generated a Fibonacci sequence of 10 numbers for you. The sequence is [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]. In this sequence, each number is the sum of the two preceding ones. The sequence starts with 0 and 1, and the largest number in this 10-number sequence is 34. The sequence has been stored in IPFS for future reference, and a schema has been automatically generated to describe the data structure.
```

## Key Points

1. **Tool Definition**: The Fibonacci tool is defined with a clear interface and parameters.
2. **Pipe Configuration**: Pipe is configured with token limiting and schema generation.
3. **OpenAI Integration**: The example shows how to use OpenAI's function calling with wrapped tools.
4. **Data Storage**: Results are automatically stored in IPFS with generated schemas.
5. **Error Handling**: The example includes basic error handling.

## Next Steps

- Try modifying the example to use different tools
- Experiment with different OpenAI models and parameters
- Add pre and post-storage hooks for additional processing
- Explore different storage scopes and pinning options 