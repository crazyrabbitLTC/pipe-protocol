# Pipe Protocol OpenAI Function Calling Example

This example demonstrates how to use Pipe Protocol with OpenAI's function calling feature and a custom tool that generates Fibonacci sequences. It showcases automatic IPFS storage, schema generation, and result retrieval.

## Features

- OpenAI function calling integration
- Fibonacci sequence generation
- Automatic IPFS storage
- Schema generation
- Result retrieval with metadata

## Prerequisites

- Node.js 16 or later
- npm 7 or later
- OpenAI API key
- Running IPFS node or configuration

## Setup

1. Clone the repository and navigate to the example directory:
```bash
cd examples/openai-function-calling
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your OpenAI API key:
```bash
OPENAI_API_KEY=your_api_key_here
```

## Running the Example

Start the example:
```bash
npm start
```

The example will:
1. Send a request to OpenAI to generate a Fibonacci sequence
2. Call the wrapped Fibonacci tool
3. Store the result in IPFS
4. Generate and store a schema
5. Retrieve the stored data and schema
6. Get AI's response about the sequence

## Example Output

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

AI Response: I've generated a Fibonacci sequence of 10 numbers for you...
```

## Key Components

1. **Tool Definition**: The Fibonacci tool is defined with a clear interface and parameters.
2. **Pipe Configuration**: Pipe is configured with token limiting and schema generation.
3. **OpenAI Integration**: The example shows how to use OpenAI's function calling with wrapped tools.
4. **Data Storage**: Results are automatically stored in IPFS with generated schemas.
5. **Error Handling**: The example includes basic error handling.

## Customization

You can modify the example to:
- Use different tools
- Experiment with different OpenAI models and parameters
- Add pre and post-storage hooks
- Explore different storage scopes and pinning options

## License

MIT 