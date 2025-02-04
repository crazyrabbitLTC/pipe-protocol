/**
 * @file OpenAI Function Calling Example
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2024-02-03
 * 
 * Example demonstrating Pipe Protocol with OpenAI function calling and a Fibonacci tool
 * 
 * IMPORTANT:
 * - Requires OpenAI API key in environment variables
 * - Requires running IPFS node or configuration
 * - Maintain error handling and logging
 * 
 * Functionality:
 * - OpenAI function calling integration
 * - Fibonacci sequence generation
 * - Automatic IPFS storage
 * - Schema generation
 * - Result retrieval
 */

import { Pipe } from 'pipe-protocol';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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