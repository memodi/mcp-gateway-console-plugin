// mock broker server for development
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// mock broker status endpoint - matches actual broker API structure
app.get('/api/mcp/status', (req, res) => {
  const now = new Date().toISOString();
  res.json({
    servers: [
      {
        id: 'weather-server:weather_:',
        name: 'mcp-test/weather-server',
        lastValidated: now,
        message: 'Successfully connected to MCP server',
        ready: true,
        totalTools: 3,
      },
      {
        id: 'github-mcp:github_:',
        name: 'mcp-prod/github-mcp',
        lastValidated: now,
        message: 'Successfully connected to MCP server',
        ready: true,
        totalTools: 6,
      },
      {
        id: 'calculator:calc_:',
        name: 'mcp-test/calculator',
        lastValidated: now,
        message: 'Successfully connected to MCP server',
        ready: true,
        totalTools: 5,
      },
      {
        id: 'broken-server:broken_:',
        name: 'mcp-test/broken-server',
        lastValidated: now,
        message: 'Connection refused: dial tcp 10.0.1.50:8080: connect: connection refused',
        ready: false,
        totalTools: 0,
      },
      {
        id: 'disconnected-server:disco_:',
        name: 'mcp-test/disconnected-server',
        lastValidated: now,
        message: 'Server disconnected',
        ready: false,
        totalTools: 0,
      },
    ],
    overallValid: false,
    totalServers: 5,
    healthyServers: 3,
    unHealthyServers: 2,
    toolConflicts: 0,
    timestamp: now,
  });
});

// mock mcp tools/list endpoint
app.post('/api/mcp/mcp', (req, res) => {
  const { method } = req.body;

  if (method === 'tools/list') {
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools: [
          {
            name: 'weather_get_forecast',
            description: 'Get weather forecast for a location',
            inputSchema: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'City name or coordinates' },
                days: { type: 'number', description: 'Number of days (1-7)' },
              },
              required: ['location'],
            },
          },
          {
            name: 'weather_current',
            description: 'Get current weather conditions',
            inputSchema: {
              type: 'object',
              properties: {
                location: { type: 'string', description: 'City name' },
              },
              required: ['location'],
            },
          },
          {
            name: 'weather_alerts',
            description: 'Get weather alerts for a region',
            inputSchema: {
              type: 'object',
              properties: {
                region: { type: 'string', description: 'Region code' },
              },
              required: ['region'],
            },
          },
          {
            name: 'github_create_issue',
            description: 'Create a GitHub issue',
            inputSchema: {
              type: 'object',
              properties: {
                repo: { type: 'string', description: 'Repository (owner/name)' },
                title: { type: 'string', description: 'Issue title' },
                body: { type: 'string', description: 'Issue body' },
                labels: { type: 'array', items: { type: 'string' } },
              },
              required: ['repo', 'title'],
            },
          },
          {
            name: 'github_search_repos',
            description: 'Search GitHub repositories',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                limit: { type: 'number', description: 'Max results' },
              },
              required: ['query'],
            },
          },
          {
            name: 'github_get_pr',
            description: 'Get pull request details',
            inputSchema: {
              type: 'object',
              properties: {
                repo: { type: 'string' },
                pr_number: { type: 'number' },
              },
              required: ['repo', 'pr_number'],
            },
          },
          {
            name: 'calc_add',
            description: 'Add two numbers',
            inputSchema: {
              type: 'object',
              properties: {
                a: { type: 'number' },
                b: { type: 'number' },
              },
              required: ['a', 'b'],
            },
          },
          {
            name: 'calc_multiply',
            description: 'Multiply two numbers',
            inputSchema: {
              type: 'object',
              properties: {
                a: { type: 'number' },
                b: { type: 'number' },
              },
              required: ['a', 'b'],
            },
          },
          {
            name: 'calc_divide',
            description: 'Divide two numbers',
            inputSchema: {
              type: 'object',
              properties: {
                numerator: { type: 'number' },
                denominator: { type: 'number' },
              },
              required: ['numerator', 'denominator'],
            },
          },
          {
            name: 'calc_power',
            description: 'Calculate power',
            inputSchema: {
              type: 'object',
              properties: {
                base: { type: 'number' },
                exponent: { type: 'number' },
              },
              required: ['base', 'exponent'],
            },
          },
          {
            name: 'calc_sqrt',
            description: 'Calculate square root',
            inputSchema: {
              type: 'object',
              properties: {
                value: { type: 'number' },
              },
              required: ['value'],
            },
          },
        ],
      },
    });
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      id: req.body.id,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Mock broker running on http://localhost:${PORT}`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/mcp/status`);
  console.log(`MCP endpoint: http://localhost:${PORT}/api/mcp/mcp`);
});
