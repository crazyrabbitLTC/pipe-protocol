"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPipeAPI = createPipeAPI;
const express_1 = require("express");
function createPipeAPI(pipe) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.post('/publish', async (req, res) => {
        try {
            const record = req.body;
            const published = await pipe.publishRecord(record);
            res.json(published);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.post('/publish-bundle', async (req, res) => {
        try {
            const bundle = req.body;
            const published = await pipe.publishBundle(bundle);
            res.json(published);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.get('/fetch', async (req, res) => {
        try {
            const { cid, scope } = req.query;
            if (!cid || !scope) {
                return res.status(400).json({ error: 'Missing cid or scope parameter' });
            }
            const record = await pipe.fetchRecord(cid, scope);
            res.json(record);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.post('/pin', async (req, res) => {
        try {
            const { cid, scope } = req.body;
            if (!cid || !scope) {
                return res.status(400).json({ error: 'Missing cid or scope parameter' });
            }
            await pipe.pin(cid, scope);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.post('/unpin', async (req, res) => {
        try {
            const { cid, scope } = req.body;
            if (!cid || !scope) {
                return res.status(400).json({ error: 'Missing cid or scope parameter' });
            }
            await pipe.unpin(cid, scope);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.post('/replicate', async (req, res) => {
        try {
            const { cid, fromScope, toScope } = req.body;
            if (!cid || !fromScope || !toScope) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }
            await pipe.replicate(cid, fromScope, toScope);
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.get('/node-status', async (_req, res) => {
        try {
            const status = await pipe.getStatus();
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.get('/node-info', async (req, res) => {
        try {
            const { scope } = req.query;
            if (!scope) {
                return res.status(400).json({ error: 'Missing scope parameter' });
            }
            const info = await pipe.getNodeInfo(scope);
            res.json(info);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.get('/storage-metrics', async (req, res) => {
        try {
            const { scope } = req.query;
            if (!scope) {
                return res.status(400).json({ error: 'Missing scope parameter' });
            }
            const metrics = await pipe.getStorageMetrics(scope);
            res.json(metrics);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.get('/pinned-cids', async (req, res) => {
        try {
            const { scope } = req.query;
            if (!scope) {
                return res.status(400).json({ error: 'Missing scope parameter' });
            }
            const cids = await pipe.getPinnedCids(scope);
            res.json(cids);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    app.get('/configuration', async (req, res) => {
        try {
            const { scope } = req.query;
            if (!scope) {
                return res.status(400).json({ error: 'Missing scope parameter' });
            }
            const config = await pipe.getConfiguration(scope);
            res.json(config);
        }
        catch (error) {
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    return app;
}
//# sourceMappingURL=api.js.map