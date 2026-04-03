#!/usr/bin/env node

// simple mock server for local development testing
// serves /api/mcp/status and /api/mcp/mcp endpoints with mock data

const http = require('http');

// mock data - multiple servers with different states
const mockServers = [
  {
    id: 'server1:s1_:server1.mcp-test.svc.cluster.local:8080',
    name: 'Weather Service',
    ready: true,
    message: 'connected',
    totalTools: 3,
    lastValidated: new Date().toISOString(),
  },
  {
    id: 'server2:s2_:server2.mcp-test.svc.cluster.local:8080',
    name: 'GitHub API',
    ready: true,
    message: 'connected',
    totalTools: 8,
    lastValidated: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: 'server3:custom_:server3.mcp-test.svc.cluster.local:8080',
    name: 'Custom Tools',
    ready: true,
    message: 'connected',
    totalTools: 5,
    lastValidated: new Date(Date.now() - 10000).toISOString(),
  },
  {
    id: 'server4:broken_:broken.mcp-test.svc.cluster.local:8080',
    name: 'Broken Server',
    ready: false,
    message: 'connection refused',
    totalTools: 0,
    lastValidated: new Date(Date.now() - 60000).toISOString(),
  },
];

// mock tools from different servers
const mockTools = [
  // Weather Service tools (s1_ prefix)
  {
    name: 's1_get_weather',
    description: 'Get current weather for a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name or coordinates' },
        units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature units' },
      },
      required: ['location'],
    },
  },
  {
    name: 's1_get_forecast',
    description: 'Get weather forecast for next 7 days',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
        days: { type: 'number', description: 'Number of days (1-7)', minimum: 1, maximum: 7 },
      },
      required: ['location'],
    },
  },
  {
    name: 's1_weather_alerts',
    description: 'Check for weather alerts in area',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string' },
      },
      required: ['location'],
    },
  },

  // GitHub API tools (s2_ prefix)
  {
    name: 's2_search_repos',
    description: 'Search GitHub repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        language: { type: 'string', description: 'Filter by language' },
        stars: { type: 'number', description: 'Minimum stars' },
      },
      required: ['query'],
    },
  },
  {
    name: 's2_get_user',
    description: 'Get GitHub user information',
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
      },
      required: ['username'],
    },
  },
  {
    name: 's2_list_issues',
    description: 'List issues in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        state: { type: 'string', enum: ['open', 'closed', 'all'] },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 's2_create_issue',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        title: { type: 'string' },
        body: { type: 'string' },
        labels: { type: 'array', items: { type: 'string' } },
      },
      required: ['owner', 'repo', 'title'],
    },
  },
  {
    name: 's2_get_pr',
    description: 'Get pull request details',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        pr_number: { type: 'number' },
      },
      required: ['owner', 'repo', 'pr_number'],
    },
  },
  {
    name: 's2_list_commits',
    description: 'List commits in repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        branch: { type: 'string' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 's2_get_file',
    description: 'Get file contents from repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string' },
        repo: { type: 'string' },
        path: { type: 'string' },
        ref: { type: 'string', description: 'Branch/tag/commit' },
      },
      required: ['owner', 'repo', 'path'],
    },
  },
  {
    name: 's2_search_code',
    description: 'Search code across repositories',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },

  // Custom Tools (custom_ prefix)
  {
    name: 'custom_echo',
    description: 'Echo back the input',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
  },
  {
    name: 'custom_calculate',
    description: 'Perform mathematical calculations',
    inputSchema: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'Math expression to evaluate' },
      },
      required: ['expression'],
    },
  },
  {
    name: 'custom_timestamp',
    description: 'Get current timestamp in various formats',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['unix', 'iso', 'locale'], description: 'Timestamp format' },
      },
    },
  },
  {
    name: 'custom_random',
    description: 'Generate random numbers',
    inputSchema: {
      type: 'object',
      properties: {
        min: { type: 'number' },
        max: { type: 'number' },
        count: { type: 'number', description: 'How many numbers to generate' },
      },
      required: ['min', 'max'],
    },
  },
  {
    name: 'custom_base64',
    description: 'Base64 encode/decode strings',
    inputSchema: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['encode', 'decode'] },
        input: { type: 'string' },
      },
      required: ['operation', 'input'],
    },
  },
];

const server = http.createServer((req, res) => {
  // enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id, X-CSRFToken');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // /api/mcp/status - broker status endpoint
  if (req.url === '/api/mcp/status' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ servers: mockServers }));
    return;
  }

  // /api/mcp/mcp - MCP protocol endpoint
  if (req.url === '/api/mcp/mcp' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const request = JSON.parse(body);

        // set session ID header
        res.setHeader('mcp-session-id', 'mock-session-12345');
        res.setHeader('Content-Type', 'application/json');

        // handle initialize
        if (request.method === 'initialize') {
          res.writeHead(200);
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'mock-mcp-broker',
                version: '1.0.0',
              },
            },
          }));
          return;
        }

        // handle tools/list
        if (request.method === 'tools/list') {
          res.writeHead(200);
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: mockTools,
            },
          }));
          return;
        }

        // handle tools/call
        if (request.method === 'tools/call') {
          res.writeHead(200);
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Mock result for tool: ${request.params?.name}`,
                },
              ],
            },
          }));
          return;
        }

        // unknown method
        res.writeHead(200);
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON-RPC request' }));
      }
    });
    return;
  }

  // not found
  res.writeHead(404);
  res.end('Not found');
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Mock MCP Broker running at http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/mcp/status`);
  console.log(`  POST http://localhost:${PORT}/api/mcp/mcp`);
  console.log('');
  console.log('Mock data includes:');
  console.log(`  - ${mockServers.length} servers (${mockServers.filter(s => s.ready).length} ready, ${mockServers.filter(s => !s.ready).length} not ready)`);
  console.log(`  - ${mockTools.length} tools across servers`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});
