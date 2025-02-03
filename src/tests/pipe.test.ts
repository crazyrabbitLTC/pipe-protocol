import { PipeProtocol, PipeOptions } from '../pipe';
import { pipe } from '../index';
import { createApi } from '../api';
import { PipeRecord, PipeBundle } from '../types';
import { AddressInfo } from 'net';
import { Server } from 'http';

const mockRecord: PipeRecord = {
  type: 'data',
  content: { message: 'test data'},
  scope: 'private',
  accessPolicy: { hiddenFromLLM: false },
  encryption: { enabled: false }
};

const mockSchema: PipeRecord = {
  type: 'schema',
  content: { properties: { message: {type: 'string'}}},
  scope: 'private',
  accessPolicy: { hiddenFromLLM: false },
  encryption: { enabled: false }
};

const mockBundle: PipeBundle = {
  schemaRecord: mockSchema,
  dataRecord: mockRecord,
  combinedScope: 'private',
  timestamp: new Date().toISOString()
};

describe('Pipe Core Functionality', () => {
  let pipeProtocol: PipeProtocol;
  let server: Server;
  let port: number;

  beforeAll(async () => {
    const options: PipeOptions = {
      publicNodeEndpoint: 'https://ipfs.infura.io:5001'
    };
    pipeProtocol = new PipeProtocol(options);
    const app = createApi(pipeProtocol);
    server = app.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async() => {
    server.close();
    await pipeProtocol.stop();
  });

  it('Tool Wrapping', () => {
    const tools = [{
      name: 'weatherTool',
      description: 'Get weather data',
      call: () => 'Sunny'
    }];

    const wrapped = pipe(tools);
    const pipeTool = wrapped.find(t => t.name === 'Pipe');
    expect(pipeTool).toBeDefined();
  });

  it('Should publish a record and return a cid', async () => {
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
    const status = pipeProtocol.getStatus();
    expect(status.localNode).toBe(true);
    expect(status.publicNode).toBe(true);
  });

  it('Should get node info', () => {
    const info = pipeProtocol.getNodeInfo('private');
    expect(info.peerId).toBeDefined();
  });

  it('Should be able to post a record to the api and return a record', async () => {
    const response = await fetch(`http://localhost:${port}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRecord)
    });
    const data = await response.json();
    expect(data.cid).toBeDefined();
  });

  it('Should be able to get a record from the api', async () => {
    const published = await pipeProtocol.publishRecord(mockRecord);
    const response = await fetch(`http://localhost:${port}/fetch?cid=${published.cid}&scope=private`);
    const data = await response.json();
    expect(data.content).toEqual(mockRecord.content);
  });

  it('Should be able to get the node status from the api', async () => {
    const response = await fetch(`http://localhost:${port}/node-status`);
    const status = await response.json();
    expect(status.localNode).toBe(true);
    expect(status.publicNode).toBe(true);
  });

  it('Should be able to get the node info from the api', async () => {
    const response = await fetch(`http://localhost:${port}/node-info?scope=private`);
    const info = await response.json();
    expect(info.peerId).toBeDefined();
  });

  it('Should be able to get storage metrics from the api', async() => {
    const response = await fetch(`http://localhost:${port}/storage-metrics?scope=private`);
    const metrics = await response.json();
    expect(metrics.repoSize).toBeDefined();
  });

  it('Should be able to get the pinned CIDs from the api', async () => {
    const record = await pipeProtocol.publishRecord(mockRecord);
    await pipeProtocol.pin(record.cid || '', 'private');
    const response = await fetch(`http://localhost:${port}/pinned-cids?scope=private`);
    const pins = await response.json();
    expect(pins).toContain(record.cid);
  });

  it('Should be able to get the configuration from the api', async () => {
    const response = await fetch(`http://localhost:${port}/configuration?scope=private`);
    const config = await response.json();
    expect(config.peerId).toBeDefined();
    expect(config.addrs).toBeDefined();
  });
}); 
