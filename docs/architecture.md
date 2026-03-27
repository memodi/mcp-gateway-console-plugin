# MCP Gateway Console Plugin Architecture

## Overview

This console plugin provides a UI for managing and monitoring Model Context Protocol (MCP) servers in OpenShift. It integrates with the mcp-gateway broker to display server status, available tools, and respects user authorization policies.

## Personas:
1. Cluster admin monitoring statuses of MCP servers and tools.
3. Developer writing or using an AI agent, the agent interacting with MCP gateway who's looking to use available MCP tools.

## User Stories

1. **As a cluster admin**, I want to see all registered MCP servers and their status.
2. **As a developer of an AI agent**, I want to see what tools are available from each server.
3. **As a developer of an AI agent**, I want to see only tools I'm authorized to use.

### Implementation Status
- ✅ User Story #1: Implemented - shows all registered MCPServerRegistration servers and their ready status
- ✅ User Story #2: Implemented - displays all tools with server context
- ⏳ User Story #3: Planned for Phase 2 - requires AuthPolicy integration

### Known Limitations
- **Virtual Servers**: MCPVirtualServer CRDs are not exposed in the broker `/status` endpoint. Virtual servers are resolved at request-time via HTTP headers (`GetVirtualSeverByHeader`) and cannot be listed via the status API. Future enhancement would require a new broker API endpoint.
- **Tool Status**: Individual tools do not have separate status from their parent server. Tool availability is determined by server readiness.

## Deployment Architecture

The console plugin is deployed as a standalone component in the mcp-system namespace, managed by the MCPGatewayExtension controller:

### Resources Created
- **Deployment**: `mcp-gateway-console-plugin` (2 replicas)
  - Container: nginx serving React app
  - Image: `ghcr.io/kuadrant/mcp-gateway-console-plugin:latest` (configurable)
  - Port: 9443 (HTTPS with service-serving cert)

- **Service**: `mcp-gateway-console-plugin`
  - ClusterIP service on port 9443
  - Annotation: `service.beta.openshift.io/serving-cert-secret-name` for automatic TLS cert

- **ConfigMap**: `mcp-gateway-console-plugin-nginx`
  - nginx configuration with proxy rules
  - `/status` proxies to broker service (HTTP)
  - `/mcp` proxies to gateway route (HTTPS)

- **ServiceAccount**: `mcp-gateway-console-plugin`
  - No RBAC permissions needed (nginx doesn't access K8s API)

- **ConsolePlugin** (cluster-scoped): `mcp-gateway-console-plugin`
  - Registers plugin with OpenShift Console
  - Configures proxy endpoint with alias `broker`
  - Authorization mode: `UserToken` (forwards user's bearer token)

### Controller Reconciliation
The MCPGatewayExtension controller automatically:
1. Creates console plugin resources when MCPGatewayExtension is created
2. Uses singleton pattern - one console plugin per cluster
3. Multiple MCPGatewayExtensions share the same console plugin
4. Owner references ensure cleanup when last MCPGatewayExtension is deleted

## Component Architecture

### React Components

```
MCPOverview (Dashboard - default route)
├── ServerStatusCard (summary card)
├── ToolsSummaryCard (summary card)
└── ServerStatusTable (table with status icons)

MCPToolsList (Tools view)
├── Toolbar
│   ├── SearchInput (filter by name)
│   └── RefreshButton
└── ToolsTable (expandable rows with schema details)
```

**Note**: The original plan included MCPServerList as a separate page, but the current implementation combines server status into the overview dashboard. Tools have their own dedicated page with filtering capabilities.

### Custom Hooks

- `useMCPServers()` - Fetches broker status, enriches server data with tool prefix
- `useMCPTools()` - Manages MCP session, fetches tools via initialize + tools/list
- `useUserAuth()` - Placeholder for future authorization integration

### Key Implementation Details

- **Server Enrichment**: Server status from `/status` is enriched by extracting tool prefix from server ID (`name:prefix:hostname`)
- **Tool Enrichment**: Tools from `/mcp` are enriched by matching against server prefixes to determine source server
- **Session Management**: `useMCPTools` automatically initializes MCP session on first call, caches session ID for subsequent requests
- **Error Handling**: Both hooks provide loading/error states for UI feedback
- **Auto-refresh**: Overview fetches server status every 30 seconds

## Data Flow

```
OpenShift Console
    ↓ (serves plugin via ConsolePlugin proxy)
Console Plugin (React App in nginx pod)
    ↓ (fetch with CSRF token for POST)
OpenShift Console Proxy (/api/proxy/plugin/mcp-gateway-console-plugin/broker)
    ↓ (forwards with UserToken authorization)
Console Plugin nginx
    ├── /status → Broker Service (direct, port 8080)
    └── /mcp → Gateway Route (via ext_proc, HTTPS)
        ↓
    MCP Gateway (Envoy + ext_proc)
        ↓ (session management, routing)
    MCP Broker
        ↓
    Upstream MCP Servers
```

### Network Path Details

1. **Frontend to OpenShift Console Proxy**:
   - URL: `/api/proxy/plugin/mcp-gateway-console-plugin/broker/{status,mcp}`
   - Headers: `X-CSRFToken` (required for POST), `Authorization: Bearer <user-token>` (added by Console)
   - Console validates CSRF token and user authentication

2. **Console Proxy to nginx**:
   - Service: `mcp-gateway-console-plugin:9443` (HTTPS, self-signed cert from service.beta.openshift.io/serving-cert-secret-name)
   - nginx terminates TLS, proxies to backend

3. **nginx to Backend Services**:
   - `/status` → `http://mcp-gateway.mcp-system.svc.cluster.local:8080/status` (direct to broker)
   - `/mcp` → `https://{gateway-public-host}/mcp` (via Gateway route, goes through ext_proc for session management)

### CSRF Token Handling

OpenShift Console requires CSRF tokens for POST requests made through its proxy:
- Token available in `<meta name="csrf-token">` or `csrf-token` cookie
- Frontend automatically includes `X-CSRFToken` header for POST requests
- GET requests (like `/status`) don't require CSRF token

## API Integration

### Broker Status API
- **Endpoint**: `GET /status`
- **Purpose**: Get validation status of registered MCP servers
- **Response** (matches `broker.StatusResponse`):
```json
{
  "servers": [
    {
      "id": "server-name:prefix:hostname",
      "name": "namespace/route-name",
      "lastValidated": "2026-03-20T10:30:00Z",
      "message": "Successfully connected to MCP server",
      "ready": true,
      "totalTools": 4
    }
  ],
  "overallValid": true,
  "totalServers": 3,
  "healthyServers": 2,
  "unHealthyServers": 1,
  "toolConflicts": 0,
  "timestamp": "2026-03-20T10:30:00Z"
}
```

**Note**: Server ID format is `name:toolPrefix:hostname`. Tool prefix can be extracted by splitting the ID on `:` and taking the second element.

### MCP Tools API
- **Endpoint**: `POST /mcp` (MCP JSON-RPC requests)
- **Purpose**: Interact with MCP protocol (initialize session, list tools, call tools)
- **Session Management**:
  - First request should be `initialize` to establish session
  - Session ID returned in `mcp-session-id` response header
  - Include session ID in subsequent requests via `mcp-session-id` header

**Initialize Request** (establishes session):
```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "clientInfo": {
      "name": "mcp-gateway-console",
      "version": "1.0.0"
    }
  },
  "id": 1
}
```

**Tools List Request** (after initialization):
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 2
}
```

**Response Format**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "test_hi",
        "description": "Say hello",
        "inputSchema": {
          "type": "object",
          "properties": {}
        }
      }
    ]
  },
  "id": 2
}
```

## Authorization Strategy

### Phase 1: Basic Display (Current Implementation)
- ✅ Show all tools from broker's perspective
- ✅ No authorization filtering - assumes user can see what broker sees
- ✅ Suitable for cluster admins monitoring all available tools

### Phase 2: User-Based Filtering (Future Enhancement)
**Status**: Not yet implemented
**Dependencies**: Kuadrant AuthPolicy integration with mcp-gateway

Planned approach:
- Call broker with user's OpenShift token
- Broker integrates with Kuadrant AuthPolicy to determine allowed tools
- Only display tools user is authorized to call
- May also integrate with RateLimitPolicy to show rate limits

Implementation plan:
```typescript
// Get user's token from OpenShift Console SDK
const token = await k8sGet(...);

// Call broker with user's authorization
const response = await fetch('/mcp', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Note**: This requires mcp-gateway broker to implement AuthPolicy filtering before returning tool lists.

## Component Details

### MCPOverview
- Summary cards: server health, tool count
- Server status table with name, status, tools, last validated
- Auto-refresh every 30s
- Link to tools page

### MCPToolsList
- Search/filter toolbar
- Expandable table: name, server, description
- Expandable rows show full JSON schema
- Auto-initializes MCP session

## Routing

Active routes:
- `/mcp-gateway` - Overview dashboard (default)
- `/mcp-gateway/tools` - Tools list page

## State Management

Using React hooks (no Redux needed for initial version):
- `useState` - Component-level state
- `useEffect` - API calls and side effects
- Custom hooks:
  - `useMCPServers()` - Fetch and manage server list
  - `useMCPTools()` - Fetch and manage tools list
  - `useUserAuth()` - Manage user authorization context

## Error Handling

- Network errors: Show PatternFly Alert component
- Empty states: Show PatternFly EmptyState
- Loading states: Show PatternFly Spinner

## Testing Strategy

### Unit Tests (Jest)
- Test individual components in isolation
- Test custom hooks
- Test utility functions

### E2E Tests (Cypress)
- Test complete user flows
- Test navigation between pages
- Test filtering and search

## Accessibility

- Use semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- PatternFly components provide built-in accessibility

## Internationalization

- All user-facing strings use i18next
- Translation files in `/locales`
- Use `useTranslation()` hook in components

## Development Workflow

1. Start local development: `yarn start`
2. Make changes to components
3. Test in browser (hot reload enabled)
4. Write Cypress tests
5. Build: `yarn build`
6. Deploy to OpenShift cluster

## Troubleshooting

### 403 Forbidden on Tools List

**Symptom**: Overview shows servers but tools list returns 403 error with "CSRF token does not match CSRF cookie"

**Cause**: OpenShift Console requires CSRF tokens for POST requests made through its proxy

**Solution**: Frontend automatically includes `X-CSRFToken` header (extracted from meta tag or cookie) for POST requests to `/mcp` endpoint

### Console Plugin Not Loading

**Symptom**: Plugin doesn't appear in OpenShift Console navigation

**Check**:
1. ConsolePlugin CR exists: `oc get consoleplugin mcp-gateway-console-plugin`
2. Plugin enabled in Console operator: `oc get console.operator cluster -o jsonpath='{.spec.plugins}'`
3. Console plugin deployment running: `oc get pods -n mcp-system -l app.kubernetes.io/name=mcp-gateway-console-plugin`
4. Service has endpoints: `oc get endpoints mcp-gateway-console-plugin -n mcp-system`

### Tools List Empty

**Symptom**: Server status shows healthy servers but no tools appear

**Check**:
1. Broker logs for tool discovery: `oc logs -n mcp-system deployment/mcp-gateway | grep tools`
2. Session initialization: Check browser network tab for `initialize` request before `tools/list`
3. MCP session ID: Response headers should include `mcp-session-id`

### nginx Proxy Errors

**Symptom**: 502 Bad Gateway or connection refused errors

**Check**:
1. nginx configuration: `oc get configmap mcp-gateway-console-plugin-nginx -n mcp-system -o yaml`
2. Broker service endpoints: `oc get endpoints mcp-gateway -n mcp-system`
3. Gateway route exists: `oc get route -n gateway-system`
4. nginx logs: `oc logs -n mcp-system deployment/mcp-gateway-console-plugin`

## Next Steps

1. ✅ Implement API client module
2. ✅ Create MCPOverview component
3. ✅ Create MCPServerList component
4. ✅ Create MCPToolsList component
5. ⏳ Add authorization filtering (Phase 2)
6. ⏳ Write comprehensive tests
