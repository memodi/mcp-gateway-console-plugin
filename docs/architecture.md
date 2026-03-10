# MCP Gateway Console Plugin Architecture

## Overview

This console plugin provides a UI for managing and monitoring Model Context Protocol (MCP) servers in OpenShift. It integrates with the mcp-gateway broker to display server status, available tools, and respects user authorization policies.

## User Stories

1. **As a user**, I want to see all registered MCP servers and their status based on the access privileges.
2. **As a user**, I want to see what tools are available from each server and their status
3. **As a user**, I want to see only tools I'm authorized to use

## Component Architecture

```
App
├── MCPOverview (Dashboard)
│   ├── ServerStatusCard
│   └── ToolsSummaryCard
├── MCPServerList (Main list view)
│   ├── MCPServerTable
│   └── MCPServerRow
└── MCPToolsList (Tools view)
    ├── ToolsFilter
    └── ToolsTable
```

## Data Flow

```
OpenShift Console
    ↓
Console Plugin (React App)
    ↓
API Client (fetch)
    ↓
MCP Gateway Broker API
    ├── /status (server status)
    └── /mcp (tool discovery via MCP protocol)
```

## API Integration

### Broker Status API
- **Endpoint**: `GET /status`
- **Purpose**: Get registered servers and their connection status
- **Response**:
```json
{
  "servers": {
    "server1": {
      "url": "http://server1.mcp.local/mcp",
      "status": "connected",
      "toolPrefix": "s1_",
      "toolCount": 4
    }
  }
}
```

### MCP Tools API
- **Endpoint**: `POST /mcp` (tools/list request)
- **Purpose**: Discover available tools
- **Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

## Authorization Strategy

### Phase 1: Basic Display
- Show all tools from broker's perspective
- No filtering (assumes user can see what broker sees)

### Phase 2: User-Based Filtering
- Call broker with user's OpenShift token
- Broker uses AuthPolicy to determine allowed tools
- Only display tools user is authorized to call

Implementation:
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

## Component Details

### MCPOverview
- Dashboard view showing summary cards
- Server count, tool count, health status
- Quick links to detailed views

### MCPServerList
- Table view of all registered servers
- Columns: Name, Status, Tool Count, Prefix, URL
- Expandable rows showing tools from that server

### MCPToolsList
- Filterable table of all available tools
- Columns: Name, Server, Description, Input Schema
- Search and filter capabilities
- Tag-based filtering

## Routing

```typescript
// console-extensions.json
{
  "type": "console.page/route",
  "properties": {
    "path": "/mcp-gateway",
    "component": { "$codeRef": "MCPOverview" }
  }
}
```

Routes:
- `/mcp-gateway` - Overview dashboard
- `/mcp-gateway/servers` - Server list
- `/mcp-gateway/tools` - Tools list

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

## Next Steps

1. Implement API client module
2. Create MCPOverview component
3. Create MCPServerList component
4. Create MCPToolsList component
5. Add authorization filtering
6. Write comprehensive tests
