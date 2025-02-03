import { PipeProtocol } from '../pipe';
import { Tool } from '../types';

describe('PipeProtocol', () => {
  let pipe: PipeProtocol;

  beforeEach(() => {
    pipe = new PipeProtocol();
  });

  afterEach(async () => {
    await pipe.stop();
  });

  describe('data storage', () => {
    it('should store and retrieve data', async () => {
      const data = { message: 'Hello, World!' };
      const { cid } = await pipe.storeData(data);
      expect(cid).toBeDefined();

      const record = await pipe.fetchRecord(cid, 'private');
      expect(record).toBeDefined();
      expect(record?.content).toEqual(data);
    });

    it('should generate schema when storing data', async () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      const { cid, schemaCid } = await pipe.storeData(data);
      expect(cid).toBeDefined();
      expect(schemaCid).toBeDefined();

      const schemaRecord = await pipe.fetchRecord(schemaCid!, 'private');
      expect(schemaRecord).toBeDefined();
      expect(schemaRecord?.content).toMatchObject({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          email: { type: 'string' }
        }
      });
    });

    it('should handle storing data without schema', async () => {
      const data = { message: 'No Schema' };
      const { cid, schemaCid } = await pipe.storeData(data, { generateSchema: false });
      expect(cid).toBeDefined();
      expect(schemaCid).toBeNull();
    });
  });

  describe('record management', () => {
    it('should publish and fetch records', async () => {
      const record = {
        content: { message: 'Test Record' },
        type: 'data',
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false }
      };

      const published = await pipe.publishRecord(record);
      expect(published.cid).toBeDefined();

      const fetched = await pipe.fetchRecord(published.cid!, 'private');
      expect(fetched).toBeDefined();
      expect(fetched?.content).toEqual(record.content);
    });

    it('should handle encrypted records', async () => {
      const record = {
        content: { message: 'Secret Data' },
        type: 'data',
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: true }
      };

      const published = await pipe.publishRecord(record);
      expect(published.cid).toBeDefined();
      expect(published.encryption.ciphertext).toBe(true);

      const fetched = await pipe.fetchRecord(published.cid!, 'private');
      expect(fetched).toBeDefined();
      expect(fetched?.content).toEqual(record.content);
      expect(fetched?.encryption.ciphertext).toBe(false);
    });
  });

  describe('bundle management', () => {
    it('should publish and fetch bundles', async () => {
      const bundle = {
        schemaRecord: {
          content: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          type: 'schema',
          scope: 'private',
          accessPolicy: { hiddenFromLLM: false },
          encryption: { enabled: false }
        },
        dataRecord: {
          content: { message: 'Test Bundle' },
          type: 'data',
          scope: 'private',
          accessPolicy: { hiddenFromLLM: false },
          encryption: { enabled: false }
        }
      };

      const published = await pipe.publishBundle(bundle);
      expect(published.schemaRecord.cid).toBeDefined();
      expect(published.dataRecord.cid).toBeDefined();
      expect(published.timestamp).toBeDefined();

      const fetchedSchema = await pipe.fetchRecord(published.schemaRecord.cid!, 'private');
      const fetchedData = await pipe.fetchRecord(published.dataRecord.cid!, 'private');

      expect(fetchedSchema?.content).toEqual(bundle.schemaRecord.content);
      expect(fetchedData?.content).toEqual(bundle.dataRecord.content);
    });
  });

  describe('tool wrapping', () => {
    it('should wrap tools and store their results', async () => {
      const mockTool: Tool = {
        name: 'testTool',
        description: 'A test tool',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          }
        },
        call: async (args: any) => ({ result: args.input })
      };

      const wrappedTools = pipe.wrap([mockTool]);
      expect(wrappedTools).toHaveLength(1);

      const result = await wrappedTools[0].execute({ input: 'test' });
      expect(result.cid).toBeDefined();
      expect(result.schemaCid).toBeDefined();
      expect(result.description).toBe(mockTool.description);

      const storedResult = await pipe.fetchRecord(result.cid, 'private');
      expect(storedResult?.content).toEqual({ result: 'test' });
    });

    it('should handle tool execution with custom options', async () => {
      const mockTool: Tool = {
        name: 'testTool',
        description: 'A test tool',
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          }
        },
        call: async (args: any) => ({ result: args.input })
      };

      const wrappedTools = pipe.wrap([mockTool]);
      const result = await wrappedTools[0].execute({
        input: 'test',
        pipeOptions: {
          scope: 'public',
          generateSchema: false,
          pin: true
        }
      });

      expect(result.cid).toBeDefined();
      expect(result.schemaCid).toBeUndefined();

      const storedResult = await pipe.fetchRecord(result.cid, 'public');
      expect(storedResult?.content).toEqual({ result: 'test' });
    });
  });

  describe('hooks', () => {
    it('should process pre-store hooks', async () => {
      const hook = {
        name: 'testHook',
        trigger: 'pre-store' as const,
        handler: async (data: any) => ({
          ...data,
          processed: true
        })
      };

      pipe.addHook(hook);
      const { cid } = await pipe.storeData({ message: 'Test' });
      const record = await pipe.fetchRecord(cid, 'private');
      expect(record?.content).toHaveProperty('processed', true);
    });

    it('should process post-store hooks', async () => {
      let hookCalled = false;
      const hook = {
        name: 'testHook',
        trigger: 'post-store' as const,
        handler: async (data: any) => {
          hookCalled = true;
          return data;
        }
      };

      pipe.addHook(hook);
      await pipe.storeData({ message: 'Test' });
      expect(hookCalled).toBe(true);
    });
  });
}); 