import { PipeProtocol } from '../src/pipe';
import { Tool } from '../src/types';

async function main() {
  console.log('Testing LLM function wrapping with Pipe...');
  
  // Initialize PipeProtocol
  const pipe = new PipeProtocol({
    localNodeEndpoint: 'http://localhost:5001',
    publicNodeEndpoint: 'http://localhost:5001'
  });

  // Mock LLM function that simulates making an API call
  const mockLLMCall = async (prompt: string): Promise<string> => {
    console.log('Making mock LLM call with prompt:', prompt);
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Response to: ${prompt}\nThis is a simulated LLM response that provides an answer to your query.`;
  };

  // Create a tool definition for the LLM function
  const llmTool: Tool = {
    name: 'llm-query',
    description: 'Makes a query to a language model and returns its response',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt to send to the language model'
        }
      },
      required: ['prompt']
    },
    call: async (args: { prompt: string }) => {
      const response = await mockLLMCall(args.prompt);
      return {
        prompt: args.prompt,
        response,
        timestamp: new Date().toISOString(),
        metadata: {
          model: 'mock-llm-model',
          version: '1.0.0'
        }
      };
    }
  };

  try {
    // Wrap the LLM tool with Pipe
    const [wrappedLLMTool] = pipe.wrap([llmTool]);

    // Test the wrapped tool with different prompts
    const prompts = [
      'What is the capital of France?',
      'Explain quantum computing in simple terms',
      'Write a haiku about programming'
    ];

    console.log('\nTesting wrapped LLM tool with multiple prompts...');
    
    for (const prompt of prompts) {
      console.log(`\nSending prompt: "${prompt}"`);
      
      const result = await wrappedLLMTool.execute({
        prompt,
        pipeOptions: {
          scope: 'private',
          generateSchema: true,
          pin: true
        }
      });

      console.log('Result CID:', result.cid);
      console.log('Schema CID:', result.schemaCid);
      
      // Fetch the stored result
      const storedRecord = await pipe.fetchRecord(result.cid, 'private');
      console.log('Stored content:', storedRecord?.content);
    }

    // Clean up
    await pipe.stop();
    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Error during test:', error);
    await pipe.stop();
    process.exit(1);
  }
}

// Run the test
main().catch(console.error); 