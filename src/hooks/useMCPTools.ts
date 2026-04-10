// custom hook for fetching and managing mcp tools

import { useState, useEffect, useCallback } from 'react';
import { listTools } from '../api/client';
import { EnrichedTool, Tool, APIError, MCPVirtualServer } from '../api/types';
import { useMCPServers } from './useMCPServers';
import { useMCPVirtualServers } from './useMCPVirtualServers';

interface UseMCPToolsResult {
  tools: EnrichedTool[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage MCP tools with server context
 *
 * This hook enriches tools with server information by:
 * 1. Fetching server list to get prefixes
 * 2. Fetching tools list via MCP protocol
 * 3. Mapping tools to their servers based on prefix
 *
 * Usage:
 * ```tsx
 * function ToolsList() {
 *   const { tools, loading, error } = useMCPTools();
 *
 *   return (
 *     <Table>
 *       {tools.map(tool => (
 *         <Tr key={tool.fullName}>
 *           <Td>{tool.name}</Td>
 *           <Td>{tool.serverName}</Td>
 *         </Tr>
 *       ))}
 *     </Table>
 *   );
 * }
 * ```
 */
export function useMCPTools(
  autoRefresh = false,
  refreshInterval = 15000,
  authToken?: string,
): UseMCPToolsResult {
  const [tools, setTools] = useState<EnrichedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // get server info for prefix mapping
  const { servers, loading: serversLoading } = useMCPServers();
  // get virtual servers for tool-to-virtualserver mapping
  const { virtualServers, loading: virtualServersLoading } = useMCPVirtualServers(
    autoRefresh,
    refreshInterval,
  );

  const fetchTools = useCallback(async () => {
    // wait for servers and virtual servers to load first
    if (serversLoading || virtualServersLoading) return;

    try {
      setError(null);
      const result = await listTools(authToken);

      // build tool -> virtual servers mapping
      const toolToVirtualServers = new Map<string, string[]>();
      virtualServers.forEach((vs) => {
        vs.spec.tools.forEach((toolName) => {
          const existing = toolToVirtualServers.get(toolName) || [];
          toolToVirtualServers.set(toolName, [...existing, `${vs.metadata.namespace}/${vs.metadata.name}`]);
        });
      });

      // enrich tools with server and virtual server information
      const enrichedTools: EnrichedTool[] = result.tools.map((tool: Tool) => {
        // extract prefix from server ID format: "name:prefix:hostname"
        const server = servers.find((s) => {
          const prefix = s.id.split(':')[1];
          return tool.name.startsWith(prefix);
        });

        const serverPrefix = server ? server.id.split(':')[1] : '';

        return {
          ...tool,
          serverName: server?.name || 'unknown',
          serverPrefix,
          fullName: tool.name,
          virtualServers: toolToVirtualServers.get(tool.name),
        };
      });

      setTools(enrichedTools);
    } catch (err) {
      const errorMessage = err instanceof APIError ? err.message : 'Failed to fetch tools';
      setError(errorMessage);
      console.error('Error fetching MCP tools:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken, servers, serversLoading, virtualServers, virtualServersLoading]);

  // fetch when servers and virtual servers are ready
  useEffect(() => {
    if (!serversLoading && !virtualServersLoading) {
      fetchTools();
    }
  }, [fetchTools, serversLoading, virtualServersLoading]);

  // auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || serversLoading || virtualServersLoading) return;

    const intervalId = setInterval(fetchTools, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchTools, serversLoading, virtualServersLoading]);

  return {
    tools,
    loading: loading || serversLoading || virtualServersLoading,
    error,
    refresh: fetchTools,
  };
}
