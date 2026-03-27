# AI Agent Instructions for MCP gateway console plugin

This document provides context and guidelines for AI coding assistants working on this codebase.

## Project Overview
This is a repository for MCP gateway console plugin for OpenShift. OpenShift console plugins are dynamic plugins that can be optionally enabled to have their UI layered with OpenShift console.

**Purpose:** Provides a UI for users to:
1. View registered MCP servers and their status
2. Browse available tools from all MCP servers
3. See which tools they're authorized to use (based on AuthPolicy)

**MCP Gateway Backend:** This plugin communicates with the mcp-gateway broker API endpoints:
- `/status` - Get server registration status
- `/mcp` - MCP protocol endpoint for tool discovery and invocation 

**Key Technologies:**
- TypeScript + React 17
- PatternFly 6 (UI component library)
- Webpack 5 with Module Federation
- react-i18next for internationalization
- Cypress for e2e testing
- Helm for deployment

**Compatibility:** Requires OpenShift 4.12+ (uses ConsolePlugin CRD v1 API)

## Architecture & Patterns

### Dynamic Plugin System

This plugin uses webpack module federation to load at runtime into the OpenShift Console. Key files:

- `console-extensions.json`: Declares what the plugin adds to console (routes, nav items, etc.)
- `package.json` `consolePlugin` section: Plugin metadata and exposed modules mapping
- `webpack.config.ts`: Configures module federation and build

**Critical:** Any component referenced in `console-extensions.json` must have a corresponding entry in `package.json` under `consolePlugin.exposedModules`.

### Component Structure

- Use functional components with hooks (NO class components)
- All components should be TypeScript (`.tsx`)
- Follow PatternFly component patterns
- Use PatternFly CSS variables instead of hex colors (dark mode compatibility)

### MCP Gateway Specific Components

**MCPOverview** - Dashboard showing:
- Summary cards (total servers, connected, tools available)
- Server status table with expandable rows
- Empty state when no servers registered

**MCPToolsList** - Tools browsing with:
- Search/filter toolbar
- Expandable table showing tool details and input schema
- Empty state when no tools available

**Custom Hooks:**
- `useMCPServers()` - Fetches server list from broker `/status` endpoint
- `useMCPTools(token?)` - Fetches tools via MCP protocol, optionally filtered by user auth
- `useUserAuth()` - Manages user authentication context (placeholder for Phase 2)

### Styling Constraints

**IMPORTANT:** The `.stylelintrc.yaml` enforces strict rules to prevent breaking console:

- **NO hex colors** - use PatternFly CSS variables (e.g., `var(--pf-v6-global-palette--blue-500)`)
- **NO naked element selectors** (like `table`, `div`) - prevents overwriting console styles
- **NO `.pf-` or `.co-` prefixed classes** - these are reserved for PatternFly and console
- **Prefix all custom classes** with plugin name (e.g., `console-plugin-template__nice`)

Don't disable these rules without understanding they protect against layout breakage!

## Internationalization (i18n)

**Namespace Convention:** `plugin__<plugin-name>` (e.g., `plugin__console-plugin-template`)

### In React Components:
```tsx
const { t } = useTranslation('plugin__console-plugin-template');
return <h1>{t('Hello, World!')}</h1>;
```

### In console-extensions.json:
```json
"name": "%plugin__console-plugin-template~My Label%"
```

**After adding/changing messages:** Run `yarn i18n` to update locale files in `/locales`

## File Organization

```
src/
  api/                   # API client for mcp-gateway broker
    client.ts           # HTTP client for broker API
    types.ts            # TypeScript types for API responses
  components/            # React components
    MCPOverview/        # Dashboard with server status cards
    MCPToolsList/       # Tools browsing and search
  hooks/                 # Custom React hooks
    useMCPServers.ts    # Fetch and manage server list
    useMCPTools.ts      # Fetch and manage tools list
    useUserAuth.ts      # User authentication context
console-extensions.json  # Plugin extension declarations
package.json            # Plugin metadata in consolePlugin section
tsconfig.json           # TypeScript config (strict: false currently)
webpack.config.ts       # Module federation + build config
locales/                # i18n translation files
charts/                 # Helm chart for deployment
integration-tests/      # Cypress e2e tests
docs/                   # Documentation
  architecture.md       # UI architecture and design
  learning-guide.md     # Frontend learning resources
  authorization.md      # Authorization implementation
```

## Development Workflow

### Local Development
1. `yarn install` - install dependencies
2. `yarn start` - starts webpack dev server on port 9001 with CORS
3. `yarn start-console` - runs OpenShift console in container (requires cluster login)
4. Navigate to http://localhost:9000/example

### Code Quality
- `yarn lint` - runs eslint, prettier, and stylelint (with --fix)
- Linting is mandatory before commits
- Follow existing code patterns in the repo

### Testing
- `yarn test-cypress` - opens Cypress UI
- `yarn test-cypress-headless` - runs Cypress in CI mode
- Add e2e tests for new pages/features

## TypeScript Configuration

Current config has `strict: false` but enforces:
- `noUnusedLocals: true`
- All files should use `.tsx` extension
- Target: ES2020

**Modernization opportunity:** When touching files, consider enabling stricter TypeScript checks.

## Common Development Tasks

### Adding a New Page
1. Create component in `src/components/MyPage.tsx`
2. Add to `package.json` `exposedModules`: `"MyPage": "./components/MyPage"`
3. Add route in `console-extensions.json`:
   ```json
   {
     "type": "console.page/route",
     "properties": {
       "path": "/my-page",
       "component": { "$codeRef": "MyPage" }
     }
   }
   ```
4. Optional: Add nav item in `console-extensions.json`
5. Run `yarn i18n` if you added translatable strings

### Adding a Navigation Item
```json
{
  "type": "console.navigation/href",
  "properties": {
    "id": "my-nav-item",
    "name": "%plugin__console-plugin-template~My Page%",
    "href": "/my-page",
    "perspective": "admin",
    "section": "home"
  }
}
```

### Updating Plugin Name
When instantiating from template, update:
1. `package.json` - `name` and `consolePlugin.name`
2. `package.json` - `consolePlugin.displayName` and `description`
3. All i18n namespace references (`plugin__<name>`)
4. CSS class prefixes
5. Helm chart values

## Build & Deployment

### Building Image
```bash
docker build -t quay.io/memrhn_support_memodiodi/mcp-gateway-console-plugin:latest .
# For Apple Silicon: add --platform=linux/amd64
```

### Deploying via Helm
```bash
helm upgrade -i my-plugin charts/openshift-console-plugin \
  -n my-namespace \
  --create-namespace \
  --set plugin.image=my-plugin-image-location
```

## Important Constraints & Gotchas

1. **Template, not fork:** Users should use "Use this template", not fork
2. **i18n namespace must match ConsolePlugin resource name** with `plugin__` prefix
3. **CSS class prefixes prevent style conflicts** - always prefix with plugin name
4. **Module federation requires exact module mapping** - `exposedModules` must match `$codeRef` values
5. **PatternFly CSS variables only** - hex colors break dark mode
6. **No webpack HMR for extensions** - changes to `console-extensions.json` require restart
7. **TypeScript not in strict mode** - legacy choice, can be modernized
8. **React 17, not 18** - matches console's React version

## Extension Points

See [Console Plugin SDK README](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk) for available extension types:

- `console.page/route` - add new pages
- `console.navigation/href` - add nav items
- `console.navigation/section` - add nav sections
- `console.tab` - add tabs to resource pages
- `console.action/provider` - add actions to resources
- `console.flag` - feature flags
- Many more...

## Code Style Preferences

- Functional components with hooks (NO classes)
- TypeScript for all new files
- Use PatternFly components whenever possible
- Keep components focused and composable
- Prefer named exports for components
- Use `React.FC` or explicit return types
- CSS-in-files (not CSS-in-JS)

## Testing Strategy

- **E2E tests (Cypress):** For user flows and page rendering
- **Component tests:** Add when components have complex logic
- **Test data attributes:** Use `data-test` attributes for selectors
- Run tests locally before opening PRs

## References

- [Console Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [PatternFly React](https://www.patternfly.org/get-started/develop)
- [Dynamic Plugin Enhancement Proposal](https://github.com/openshift/enhancements/blob/master/enhancements/console/dynamic-plugins.md)

## Automatic Deployment via MCPGatewayExtension (Recent Work)

### Architecture
When MCPGatewayExtension CRD is created in mcp-gateway, the controller auto-deploys this console plugin:
- Deployment (2 replicas) with nginx serving the React SPA
- Service with TLS via service-serving-cert annotation
- ConfigMap with nginx config including broker API proxy
- ConsolePlugin CR (cluster-scoped, no owner reference)

### Critical: Nginx Proxy for Broker API
**Problem**: Browser can't reach broker API due to CORS restrictions and path mismatch.

**Solution**: Nginx reverse proxy in console plugin pod routes browser requests to broker service:
```nginx
location /status {
  proxy_pass http://mcp-gateway.<namespace>.svc.cluster.local:8080/status;
}
location /mcp {
  proxy_pass http://mcp-gateway.<namespace>.svc.cluster.local:8080/mcp;
  # WebSocket/SSE support for MCP protocol
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_buffering off;
}
```

Frontend uses `brokerBaseUrl: ''` in `src/api/client.ts` to make relative requests that nginx proxies.

### Key Files
- `src/api/client.ts` - Uses empty `brokerBaseUrl` for nginx proxy
- `Dockerfile` - nginx serves from `/usr/share/nginx/html`
- Controller generates nginx config with broker proxy at deployment time

## Quick Decision Guide

**When should I...**

- **Add a page?** Update console-extensions.json + exposedModules + create component
- **Style something?** Use PatternFly components and CSS variables, prefix custom classes
- **Add translations?** Use `t()` function, run `yarn i18n` after
- **Test changes?** Run locally with `yarn start` + `yarn start-console`, add Cypress tests
- **Deploy?** Build image, push to registry, install via Helm chart
