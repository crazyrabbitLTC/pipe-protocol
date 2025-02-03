import { PipeProtocol } from '../pipe.js';
import { pipe } from '../index';
import { createApi } from '../api';
import { expect, describe, test, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
const mockRecord = {
    type: 'data',
    content: { test: 'data' },
    scope: 'private',
    accessPolicy: { hiddenFromLLM: false },
    encryption: { enabled: false },
    pinned: true
};
const mockBundle = {
    schemaRecord: {
        type: 'schema',
        content: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                age: { type: 'number' }
            },
            required: ['name', 'age']
        },
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false },
        pinned: true
    },
    dataRecord: {
        type: 'data',
        content: {
            name: 'John Doe',
            age: 30
        },
        scope: 'private',
        accessPolicy: { hiddenFromLLM: false },
        encryption: { enabled: false },
        pinned: true
    },
    combinedScope: 'private',
    timestamp: new Date().toISOString()
};
describe('PipeProtocol', () => {
    let pipe;
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
        const status = await pipe.getStatus();
        expect(status).toEqual({
            localNode: true,
            publicNode: false
        });
    });
    test('should get node info', async () => {
        const info = await pipe.getNodeInfo('private');
        expect(info).toEqual({
            peerId: expect.any(String)
        });
    });
    test('should get storage metrics', async () => {
        const metrics = await pipe.getStorageMetrics('private');
        expect(metrics).toEqual({
            repoSize: 0
        });
    });
    test('should get configuration', async () => {
        const config = await pipe.getConfiguration('private');
        expect(config).toEqual({
            peerId: expect.any(String),
            addrs: []
        });
    });
});
describe('Pipe Core Functionality', () => {
    let pipeProtocol;
    let server;
    let port;
    beforeAll(async () => {
        const options = {
            publicNodeEndpoint: 'https://ipfs.infura.io:5001'
        };
        pipeProtocol = new PipeProtocol(options);
        const app = createApi(pipeProtocol);
        server = app.listen(0);
        port = server.address().port;
    });
    afterAll(async () => {
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
        const pipeTool = wrapped.find(t => t.name === 'Pipe');
        expect(pipeTool).toBeDefined();
    });
    test('Should publish a record and return a cid', async () => {
        const record = await pipeProtocol.publishRecord(mockRecord);
        expect(record.cid).toBeDefined();
    });
    test('Should publish a record and then fetch it', async () => {
        const published = await pipeProtocol.publishRecord(mockRecord);
        const fetched = await pipeProtocol.fetchRecord(published.cid || '', 'private');
        expect(fetched?.content).toEqual(mockRecord.content);
    });
    test('Should publish a bundle and return two cids', async () => {
        const bundle = await pipeProtocol.publishBundle(mockBundle);
        expect(bundle.dataRecord.cid).toBeDefined();
        expect(bundle.schemaRecord.cid).toBeDefined();
    });
    test('Should pin a record', async () => {
        const published = await pipeProtocol.publishRecord(mockRecord);
        await pipeProtocol.pin(published.cid || '', 'private');
    });
    test('Should unpin a record', async () => {
        const published = await pipeProtocol.publishRecord(mockRecord);
        await pipeProtocol.unpin(published.cid || '', 'private');
    });
    test('Should replicate a record', async () => {
        const published = await pipeProtocol.publishRecord(mockRecord);
        await pipeProtocol.replicate(published.cid || '', 'private', 'public');
    });
    test('Should get node status', async () => {
        const status = await pipeProtocol.getStatus();
        expect(status.localNode).toBe(true);
        expect(status.publicNode).toBe(true);
    });
    test('Should get node info', async () => {
        const info = await pipeProtocol.getNodeInfo('private');
        expect(info.peerId).toBeDefined();
    });
    test('Should be able to post a record to the api and return a record', async () => {
        const response = await fetch(`http://localhost:${port}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockRecord)
        });
        const data = await response.json();
        expect(data.cid).toBeDefined();
    });
    test('Should be able to get a record from the api', async () => {
        const published = await pipeProtocol.publishRecord(mockRecord);
        const response = await fetch(`http://localhost:${port}/fetch?cid=${published.cid}&scope=private`);
        const data = await response.json();
        expect(data.content).toEqual(mockRecord.content);
    });
    test('Should be able to get the node status from the api', async () => {
        const response = await fetch(`http://localhost:${port}/node-status`);
        const status = await response.json();
        expect(status.localNode).toBe(true);
        expect(status.publicNode).toBe(true);
    });
    test('Should be able to get the node info from the api', async () => {
        const response = await fetch(`http://localhost:${port}/node-info?scope=private`);
        const info = await response.json();
        expect(info.peerId).toBeDefined();
    });
    test('Should be able to get storage metrics from the api', async () => {
        const response = await fetch(`http://localhost:${port}/storage-metrics?scope=private`);
        const metrics = await response.json();
        expect(metrics.repoSize).toBeDefined();
    });
    test('Should be able to get the pinned CIDs from the api', async () => {
        const record = await pipeProtocol.publishRecord(mockRecord);
        await pipeProtocol.pin(record.cid || '', 'private');
        const response = await fetch(`http://localhost:${port}/pinned-cids?scope=private`);
        const pins = await response.json();
        expect(pins).toContain(record.cid);
    });
    test('Should be able to get the configuration from the api', async () => {
        const response = await fetch(`http://localhost:${port}/configuration?scope=private`);
        const config = await response.json();
        expect(config.peerId).toBeDefined();
        expect(config.addrs).toBeDefined();
    });
});
