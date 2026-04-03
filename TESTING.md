# Testing the MCP Gateway Console Plugin

## Testing with Mock Broker

The easiest way to test the plugin UI without a real MCP Gateway is to use the mock broker server.

### Option 1: Run Everything Together (Recommended)

```bash
yarn dev
```

This starts both the mock broker (on port 8080) and webpack dev server (on port 9001) concurrently.

Then in another terminal:
```bash
yarn start-console
```

Visit http://localhost:9000/ and navigate to the MCP Gateway section.

### Option 2: Run Separately

Terminal 1 - Start mock broker:
```bash
yarn mock-broker
```

Terminal 2 - Start webpack dev server:
```bash
yarn start
```

Terminal 3 - Start OpenShift console:
```bash
yarn start-console
```

## Mock Data

The mock broker provides:

### Servers (5 total)
- **weather-server** - 3 tools, connected, with credentials
- **github-mcp** - 94 tools, connected, with credentials
- **calculator** - 5 tools, connected, no credentials
- **broken-server** - 0 tools, error status, "Connection refused"
- **disconnected-server** - 0 tools, disconnected status

### Tools (11 total)
- `weather_get_forecast` - Get weather forecast (required: location)
- `weather_current` - Get current conditions (required: location)
- `weather_alerts` - Get weather alerts (required: region)
- `github_create_issue` - Create GitHub issue (required: repo, title)
- `github_search_repos` - Search repositories (required: query)
- `github_get_pr` - Get PR details (required: repo, pr_number)
- `calc_add` - Add numbers (required: a, b)
- `calc_multiply` - Multiply numbers (required: a, b)
- `calc_divide` - Divide numbers (required: numerator, denominator)
- `calc_power` - Calculate power (required: base, exponent)
- `calc_sqrt` - Square root (required: value)

## Testing Different Scenarios

### Test Server Status Colors
- Green: weather-server, github-mcp, calculator
- Red: broken-server (with error tooltip)
- Orange: disconnected-server

### Test Tool Filtering
1. Search by tool name: "weather"
2. Search by server name: "github"
3. Search by description: "add"

### Test Expandable Rows
Click the expand arrow on any tool to see:
- Full name (with prefix)
- Server name
- Tool prefix
- Description
- Complete input schema JSON

### Test Empty States
To test empty states, modify mock-broker.js:
- Empty servers: Change `servers: {}` in /status endpoint
- No matching search: Search for "zzz" in the UI

## Testing with Real MCP Gateway

If you have a real MCP Gateway running:

1. Update the broker URL in your code:
```typescript
// In browser console after page loads:
window.setAPIConfig.setBrokerBaseUrl('http://your-gateway:8080');
```

Or modify [src/api/client.ts](src/api/client.ts#L16):
```typescript
brokerBaseUrl: 'http://your-gateway:8080/api/mcp',
```

2. Configure OpenShift console proxy in `start-console.sh` to forward `/api/mcp/*` to your gateway

## Troubleshooting

### Mock broker not responding
Check if port 8080 is already in use:
```bash
lsof -i :8080
```

Change the port in mock-broker.js if needed.

### CORS errors
The mock broker includes CORS headers. If testing with real gateway, ensure it has CORS enabled:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Plugin not loading
1. Check webpack build completed: `yarn build-dev`
2. Check browser console for module loading errors
3. Verify chunks are bundled: `ls -lh dist/exposed-*-chunk.js`
4. Clear browser cache and reload
