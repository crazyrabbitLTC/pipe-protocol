import OpenAI from 'openai';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Pipe } from '../src/pipe';
import { Tool } from '../src/types';

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

    console.log('Sending request to OpenAI...');
    
    // First OpenAI call to get function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [initialMessage],
      tools
    });

    console.log('OpenAI Response:', JSON.stringify(completion.choices[0].message, null, 2));

    const toolCalls = completion.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log('No tool calls made');
      return;
    }

    console.log('OpenAI decided to call our tool...');

    // Execute the wrapped tool and get the enhanced result with IPFS storage
    const toolCall = toolCalls[0];
    const args = JSON.parse(toolCall.function.arguments);
    
    console.log('Executing wrapped tool with args:', args);
    const wrappedResult = await wrappedTools[0].call(args);
    console.log('Wrapped result:', wrappedResult);

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

    console.log('Messages being sent to OpenAI:', JSON.stringify(messages, null, 2));
    console.log('Sending result back to OpenAI...');
    
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
    console.log('\nFetching content from IPFS...');
    const storedContent = await pipe.retrieve(wrappedResult.cid);
    console.log('Content stored in IPFS:', storedContent);

    // Also fetch and display the schema if available
    if (wrappedResult.schemaCid) {
      console.log('\nFetching schema from IPFS...');
      const storedSchema = await pipe.retrieve(wrappedResult.schemaCid);
      console.log('Schema stored in IPFS:', storedSchema);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
main(); 