import { PipeProtocol } from '../pipe';
import { pipe } from '../index';
import { createApi } from '../api';
import { PipeRecord, PipeBundle, Scope } from '../types';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { expect, describe, test, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';

interface NodeStatus {
  localNode: boolean;
  publicNode: boolean;
}

interface NodeInfo {
  peerId: string;
}

interface StorageMetrics {
  repoSize: number;
  blockCount: number;
  pinnedCount: number;
}

interface NodeConfig {
  peerId: string;
  addrs: string[];
}

interface PublishResponse {
  cid: string;
}

interface FetchResponse {
  content: any;
}

interface StatusResponse extends NodeStatus {}
interface InfoResponse extends NodeInfo {}
interface MetricsResponse extends StorageMetrics {}
interface ConfigResponse extends NodeConfig {}
interface PinnedResponse extends Array<string> {}

const mockRecord: PipeRecord = {
  type: 'data',
  content: { message: 'test data' },
  scope: 'private',
  accessPolicy: { hiddenFromLLM: false }
};

const mockSchema: PipeRecord = {
  type: 'schema',
  content: { properties: { message: { type: 'string' } } },
  scope: 'private',
  accessPolicy: { hiddenFromLLM: false }
};

const mockBundle: PipeBundle = {
  schemaRecord: mockSchema,
  dataRecord: mockRecord,
  combinedScope: 'private',
  timestamp: new Date().toISOString()
};

describe('PipeProtocol', () => {
  let pipe: PipeProtocol;
  beforeEach(() => {
    pipe = new PipeProtocol({});
  });
  afterEach(async () => {
    await pipe.stop();
  });

  test('should publish and fetch a record', async () => {
    const published = await pipe.publishRecord(mockRecord);
    expect(published.cid).toBeDefined();

    if (published.cid) {
      const fetched = await pipe.fetchRecord(published.cid, 'private');
      expect(fetched?.content).toEqual(mockRecord.content);
    }
  });

  test('should get node status', async () => {
    const status = pipe.getStatus() as NodeStatus;
    expect(status).toEqual({
      localNode: true,
      publicNode: false
    });
  });

  test('should get node info', async () => {
    const info = pipe.getNodeInfo('private') as NodeInfo;
    expect(info).toEqual({
      peerId: expect.any(String)
    });
  });

  test('should get storage metrics', async () => {
    const metrics = await pipe.getStorageMetrics('private') as StorageMetrics;
    expect(metrics).toEqual({
      repoSize: 0,
      blockCount: 0,
      pinnedCount: 0
    });
  });

  test('should get configuration', async () => {
    const config = pipe.getConfiguration('private') as NodeConfig;
    expect(config).toEqual({
      peerId: expect.any(String),
      addrs: []
    });
  });

  test('Should be able to call wrap', async () => {
    const tools = [{
      name: 'testTool',
      description: 'A test tool',
      call: async (args: any) => {
        return args;
      },
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      },
      returns: {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      }
    }];
    const wrapped = pipe(tools);
    expect(wrapped[0].name).toBe('testTool');
    expect(wrapped[0].parameters).toBeDefined();
    expect(wrapped[0].returns).toBeDefined();
  });
});

describe('Pipe Core Functionality', () => {
  let pipeProtocol: PipeProtocol;
  let server: Server;
  let port: number;

  beforeAll(async () => {
    pipeProtocol = new PipeProtocol({});
    const app = createApi(pipeProtocol);
    server = app.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async() => {
    server.close();
    await pipeProtocol.stop();
  });

  test('Tool Wrapping', () => {
    const tools = [{
      name: 'weatherTool',
      description: 'Get weather data',
      call: () => 'Sunny'
    }];

    const wrapped = pipe(tools);
    expect(wrapped[0].name).toBe('weatherTool');
  });

  test('Should publish a record and return a cid', async () => {
    const record = await pipeProtocol.publishRecord(mockRecord);
    expect(record.cid).toBeDefined();
  });

  it('Should publish a record and then fetch it', async () => {
    const published = await pipeProtocol.publishRecord(mockRecord);
    const fetched = await pipeProtocol.fetchRecord(published.cid || '', 'private');
    expect(fetched?.content).toEqual(mockRecord.content);
  });

  it('Should publish a bundle and return two cids', async () => {
    const bundle = await pipeProtocol.publishBundle(mockBundle);
    expect(bundle.dataRecord.cid).toBeDefined();
    expect(bundle.schemaRecord.cid).toBeDefined();
  });

  it('Should pin a record', async () => {
    const published = await pipeProtocol.publishRecord(mockRecord);
    await pipeProtocol.pin(published.cid || '', 'private');
  });

  it('Should unpin a record', async () => {
    const published = await pipeProtocol.publishRecord(mockRecord);
    await pipeProtocol.unpin(published.cid || '', 'private');
  });

  it('Should replicate a record', async () => {
    const published = await pipeProtocol.publishRecord(mockRecord);
    await pipeProtocol.replicate(published.cid || '', 'private', 'public');
  });
    
  it('Should get node status', () => {
    const status = pipeProtocol.getStatus() as NodeStatus;
    expect(status).toEqual({
      localNode: true,
      publicNode: false
    });
  });

  it('Should get node info', () => {
    const info = pipeProtocol.getNodeInfo('private') as NodeInfo;
    expect(info.peerId).toBeDefined();
  });

  it('Should be able to post a record to the api and return a record', async () => {
    const response = await fetch(`http://localhost:${port}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRecord)
    });
    const data = await response.json() as PublishResponse;
    expect(data.cid).toBeDefined();
  });

  it('Should be able to get a record from the api', async () => {
    const published = await pipeProtocol.publishRecord(mockRecord);
    const response = await fetch(`http://localhost:${port}/fetch?cid=${published.cid}&scope=private`);
    const data = await response.json() as FetchResponse;
    expect(data.content).toEqual(mockRecord.content);
  });

  it('Should be able to get the node status from the api', async () => {
    const response = await fetch(`http://localhost:${port}/node-status`);
    const status = await response.json() as StatusResponse;
    expect(status.localNode).toBe(true);
    expect(status.publicNode).toBe(false);
  });

  it('Should be able to get the node info from the api', async () => {
    const response = await fetch(`http://localhost:${port}/node-info?scope=private`);
    const info = await response.json() as InfoResponse;
    expect(info.peerId).toBeDefined();
  });

  it('Should be able to get storage metrics from the api', async() => {
    const response = await fetch(`http://localhost:${port}/storage-metrics?scope=private`);
    const metrics = await response.json() as MetricsResponse;
    expect(metrics.repoSize).toBeDefined();
  });

  it('Should be able to get the pinned CIDs from the api', async () => {
    const record = await pipeProtocol.publishRecord(mockRecord);
    await pipeProtocol.pin(record.cid || '', 'private');
    const response = await fetch(`http://localhost:${port}/pinned-cids?scope=private`);
    const pins = await response.json() as PinnedResponse;
    expect(pins).toContain(record.cid);
  });

  it('Should be able to get the configuration from the api', async () => {
    const response = await fetch(`http://localhost:${port}/configuration?scope=private`);
    const config = await response.json() as ConfigResponse;
    expect(config.peerId).toBeDefined();
    expect(config.addrs).toBeDefined();
  });
}); 
