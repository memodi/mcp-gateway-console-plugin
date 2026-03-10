# Getting Started with MCP Gateway Console Plugin

## What We've Built

Congratulations! You now have a fully functional OpenShift Console Plugin for MCP Gateway. Here's what has been created:

### 1. Core Infrastructure

**API Client** ([src/api/](../src/api/))
- `client.ts` - HTTP client for communicating with mcp-gateway broker
- `types.ts` - TypeScript type definitions for all API responses

**Custom Hooks** ([src/hooks/](../src/hooks/))
- `useMCPServers.ts` - Fetches and manages MCP server list
- `useMCPTools.ts` - Fetches and manages tool list with server context
- `useUserAuth.ts` - User authentication context (ready for Phase 2)

### 2. UI Components

**MCPOverview Dashboard** ([src/components/MCPOverview/](../src/components/MCPOverview/))
- Summary cards showing server counts and tool availability
- Status indicators (connected, disconnected, error)
- Server status table with detailed information
- Empty state when no servers registered

**MCPToolsList** ([src/components/MCPToolsList/](../src/components/MCPToolsList/))
- Search bar for filtering tools
- Expandable table showing tool details
- Input schema display in JSON format
- Empty states for no tools or no matching results

### 3. Documentation

- [architecture.md](architecture.md) - UI architecture and component design
- [learning-guide.md](learning-guide.md) - Frontend development tutorial
- [authorization.md](authorization.md) - Authorization implementation guide
- [CLAUDE.md](../CLAUDE.md) - AI assistant context and development guidelines

### 4. Configuration

- `console-extensions.json` - Plugin routes and navigation
- `package.json` - Updated with MCP Gateway plugin metadata
- Cypress tests for E2E validation

## Next Steps

### 1. Test Locally

```bash
# install dependencies
yarn install

# start development server (terminal 1)
yarn start

# login to your cluster
oc login <cluster-url>

# start console (terminal 2)
yarn start-console

# navigate to http://localhost:9000/mcp-gateway
```

### 2. Connect to MCP Gateway

The plugin expects the broker to be accessible. Configure the broker URL:

**Option A: Default** (assumes broker is proxied through console)
- No configuration needed
- Plugin uses `/api/mcp` by default

**Option B: Custom URL**
- Set environment variable `MCP_BROKER_URL`
- Or modify `API_CONFIG` in `src/api/client.ts`

### 3. Verify Everything Works

**Check Server List:**
1. Navigate to http://localhost:9000/mcp-gateway
2. You should see either:
   - Summary cards with server statistics (if servers registered)
   - Empty state "No MCP servers registered" (if no servers)

**Check Tools List:**
1. Navigate to http://localhost:9000/mcp-gateway/tools
2. You should see either:
   - Searchable table of tools (if tools available)
   - Empty state "No tools available" (if no tools)

**Common Issues:**
- "Failed to load servers" → Check broker URL and connectivity
- Loading spinner indefinitely → Check browser console for errors
- Empty state when servers exist → Verify broker `/status` endpoint

### 4. Run Tests

```bash
# run linters
yarn lint

# run cypress tests (interactive)
yarn test-cypress

# run cypress tests (headless)
yarn test-cypress-headless
```

### 5. Build and Deploy

**Build Docker Image:**
```bash
docker build -t quay.io/<org>/mcp-gateway-console-plugin:latest .

# for Apple Silicon
docker build --platform=linux/amd64 -t quay.io/<org>/mcp-gateway-console-plugin:latest .

# push to registry
docker push quay.io/<org>/mcp-gateway-console-plugin:latest
```

**Deploy to Cluster:**
```bash
helm upgrade -i mcp-gateway-console-plugin charts/openshift-console-plugin \
  --namespace mcp-gateway \
  --create-namespace \
  --set plugin.image=quay.io/<org>/mcp-gateway-console-plugin:latest

# enable plugin
oc patch consoles.operator.openshift.io cluster \
  --type=json \
  --patch '[{"op": "add", "path": "/spec/plugins/-", "value": "mcp-gateway-console-plugin"}]'
```

## Learning Path

If you're new to frontend development, follow this learning path:

### Week 1: Basics
1. Read [learning-guide.md](learning-guide.md) sections 1-5
2. Understand React components and props
3. Learn TypeScript basic types
4. Explore PatternFly component library

### Week 2: Hooks and State
1. Study custom hooks in `src/hooks/`
2. Learn useState and useEffect patterns
3. Understand async data fetching
4. Practice with error handling

### Week 3: Components
1. Examine MCPOverview component structure
2. Understand table components and expansion
3. Learn PatternFly styling patterns
4. Practice creating new components

### Week 4: Testing and Deployment
1. Write Cypress tests
2. Learn build and deployment process
3. Understand webpack module federation
4. Practice debugging in browser DevTools

## Architecture Decisions

### Why These Technologies?

**React** - Industry standard, great for dynamic UIs, component-based
**TypeScript** - Type safety prevents runtime errors, better IDE support
**PatternFly** - Red Hat's design system, consistent with OpenShift UI
**Custom Hooks** - Reusable logic, cleaner components, easier testing

### Design Patterns Used

1. **Separation of Concerns**
   - API client isolated from UI
   - Custom hooks separate data fetching from presentation
   - Components focused on rendering

2. **Progressive Enhancement**
   - Works without authentication (Phase 1)
   - Ready for authorization filtering (Phase 2)
   - Extensible for future features

3. **User Experience**
   - Loading states prevent confusion
   - Error states provide actionable feedback
   - Empty states guide next steps
   - Search and filter for large datasets

## Customization Guide

### Add a New Page

1. Create component:
   ```tsx
   // src/components/MyPage/MyPage.tsx
   import React from 'react';
   import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';

   const MyPage: React.FC = () => {
     return (
       <>
         <DocumentTitle>My Page</DocumentTitle>
         <ListPageHeader title="My Page" />
         <PageSection>
           {/* your content */}
         </PageSection>
       </>
     );
   };

   export default MyPage;
   ```

2. Export component:
   ```typescript
   // src/components/MyPage/index.ts
   export { default } from './MyPage';
   ```

3. Update `package.json`:
   ```json
   "exposedModules": {
     "MyPage": "./components/MyPage"
   }
   ```

4. Update `console-extensions.json`:
   ```json
   {
     "type": "console.page/route",
     "properties": {
       "path": "/mcp-gateway/my-page",
       "component": { "$codeRef": "MyPage" }
     }
   }
   ```

### Add a New API Endpoint

1. Add type in `src/api/types.ts`:
   ```typescript
   export interface MyDataResponse {
     data: string[];
   }
   ```

2. Add client function in `src/api/client.ts`:
   ```typescript
   export async function getMyData(): Promise<MyDataResponse> {
     return fetchAPI<MyDataResponse>('/api/my-data');
   }
   ```

3. Create hook in `src/hooks/useMyData.ts`:
   ```typescript
   export function useMyData() {
     const [data, setData] = useState([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);

     useEffect(() => {
       getMyData()
         .then(setData)
         .catch(setError)
         .finally(() => setLoading(false));
     }, []);

     return { data, loading, error };
   }
   ```

4. Use in component:
   ```typescript
   const { data, loading, error } = useMyData();
   ```

## Troubleshooting

### Development Issues

**Hot Reload Not Working**
- Restart `yarn start`
- Changes to `console-extensions.json` require restart

**TypeScript Errors**
- Run `yarn install` to ensure types are up to date
- Check `tsconfig.json` for configuration

**Linting Errors**
- Run `yarn lint` to auto-fix
- Check `.stylelintrc.yaml` for CSS rules

### Runtime Issues

**Component Not Rendering**
- Check browser console for errors
- Verify component is exported in `exposedModules`
- Check if route matches URL

**API Calls Failing**
- Check network tab in browser DevTools
- Verify broker URL is correct
- Test broker endpoint with curl

**Styling Issues**
- Use PatternFly CSS variables, not hex colors
- Prefix custom classes with plugin name
- Check for conflicting styles

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PatternFly React](https://www.patternfly.org/get-started/develop)
- [OpenShift Console Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [MCP Gateway](https://github.com/kuadrant/mcp-gateway)

## Getting Help

- Check [CLAUDE.md](../CLAUDE.md) for development guidelines
- Review [learning-guide.md](learning-guide.md) for concepts
- Examine existing components for patterns
- Test in browser DevTools for debugging

Happy coding! 🚀
