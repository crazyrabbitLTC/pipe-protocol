import OpenAI from 'openai';
import type { ChatCompletionTool, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Pipe, Hook } from '../src/pipe';
import { Tool } from '../src/types';
import chalk from 'chalk';

// Initialize OpenAI
const openai = new OpenAI();

// Helper function for logging
const log = {
  info: (msg: string, data?: any) => {
    console.log(chalk.blue('ℹ'), chalk.blue(msg));
    if (data) console.log(chalk.gray(JSON.stringify(data, null, 2)));
  },
  success: (msg: string, data?: any) => {
    console.log(chalk.green('✓'), chalk.green(msg));
    if (data) console.log(chalk.gray(JSON.stringify(data, null, 2)));
  },
  error: (msg: string, error?: any) => {
    console.error(chalk.red('✗'), chalk.red(msg));
    if (error) console.error(chalk.red(error));
  },
  divider: () => console.log(chalk.gray('\n-------------------\n'))
};

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

// Define our hooks
const hooks: Hook[] = [
  // Validation hook - runs before storage
  {
    name: 'fibonacci-validator',
    type: 'beforeStore',
    handler: async (data: unknown) => {
      log.info('Running validation hook...');
      if (Array.isArray(data)) {
        if (data.length < 2) {
          throw new Error('Fibonacci sequence must have at least 2 numbers');
        }
        // Verify it's a valid Fibonacci sequence
        for (let i = 2; i < data.length; i++) {
          if (data[i] !== data[i-1] + data[i-2]) {
            throw new Error('Invalid Fibonacci sequence');
          }
        }
        log.success('Validation passed: Valid Fibonacci sequence');
      }
      return data;
    }
  },
  // Statistics hook - runs before storage
  {
    name: 'fibonacci-stats',
    type: 'beforeStore',
    handler: async (data: unknown) => {
      log.info('Running statistics hook...');
      if (Array.isArray(data)) {
        const stats = {
          sequence: data,
          metadata: {
            length: data.length,
            sum: data.reduce((a, b) => a + b, 0),
            average: data.reduce((a, b) => a + b, 0) / data.length,
            max: Math.max(...data),
            goldenRatioApprox: data.length > 1 ? data[data.length - 1] / data[data.length - 2] : null
          }
        };
        log.success('Statistics calculated:', stats.metadata);
        return stats;
      }
      return data;
    }
  },
  // Logging hook - runs after storage
  {
    name: 'fibonacci-logger',
    type: 'afterStore',
    handler: async (data: any) => {
      log.info('Running logging hook...');
      const timestamp = new Date().toISOString();
      log.success('Sequence stored in IPFS:', {
        cid: data.cid,
        timestamp,
        metadata: data.metadata
      });
      return {
        ...data,
        metadata: {
          ...data.metadata,
          timestamp
        }
      };
    }
  }
];

// Initialize Pipe with hooks
const pipe = new Pipe();
pipe.addHooks(hooks);

// Define our tool with properly typed parameters
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
    log.info(`Generating ${args.n} Fibonacci numbers...`);
    return generateFibonacci(args.n);
  }
};

// Wrap the tool with Pipe
const wrappedTools = pipe.wrap([fibonacciTool]);

// Format wrapped tools for OpenAI
const openAITools: ChatCompletionTool[] = wrappedTools.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object',
      properties: tool.parameters.properties,
      required: tool.parameters.required,
      additionalProperties: false
    }
  }
}));

async function main() {
  try {
    // First test: Generate Fibonacci sequence
    log.info('Testing Fibonacci sequence generation with hooks...');
    const initialMessage: ChatCompletionMessageParam = { 
      role: 'user', 
      content: 'Can you generate the first 10 numbers of the Fibonacci sequence?' 
    };

    log.info('Sending request to OpenAI...', {
      message: initialMessage,
      tools: openAITools
    });
    
    // First OpenAI call to get function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [initialMessage],
      tools: openAITools
    });

    log.success('Received response from OpenAI:', completion.choices[0].message);

    const toolCalls = completion.choices[0].message.tool_calls;
    if (!toolCalls) {
      log.error('No tool calls made');
      return;
    }

    log.info('OpenAI decided to call our tool...');

    // Execute the wrapped tool and get the enhanced result with IPFS storage
    const toolCall = toolCalls[0];
    const args = JSON.parse(toolCall.function.arguments);
    
    log.info('Executing wrapped tool with args:', args);
    const result = await wrappedTools[0].call(args);
    log.success('Tool execution completed with hooks:', result);

    // Create the messages array with proper typing
    const messages: ChatCompletionMessageParam[] = [
      initialMessage,
      completion.choices[0].message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result.content || '') // Ensure content is never null
      }
    ];

    log.info('Sending result back to OpenAI...', { messages });
    
    // Final OpenAI call to get the formatted response
    const finalCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      tools: openAITools
    });

    log.success('Final Response:', finalCompletion.choices[0].message.content);

    log.divider();
    
    log.info('Pipe Enhanced Result (processed by hooks):');
    log.info('IPFS CID:', result.cid);
    log.info('Schema CID:', result.schemaCid);
    log.info('Metadata:', result.metadata);
    log.info('Statistics:', result.sequence?.metadata);

    // Test error handling with invalid sequence
    log.divider();
    log.info('Testing hook error handling with invalid sequence...');
    try {
      const invalidResult = await wrappedTools[0].call({ n: 1 });
      log.error('Expected error but got result:', invalidResult);
    } catch (error) {
      log.success('Hook successfully caught invalid sequence:', error);
    }

  } catch (error) {
    log.error('Error during execution:', error);
  }
}

// Run the example
main(); 