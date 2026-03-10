// custom hook for fetching and managing mcp tools

import { useState, useEffect, useCallback } from 'react';
import { listTools } from '../api/client';
import { EnrichedTool, Tool, APIError } from '../api/types';
import { useMCPServers } from './useMCPServers';

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
  authToken?: string,
): UseMCPToolsResult {
  const [tools, setTools] = useState<EnrichedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // get server info for prefix mapping
  const { servers, loading: serversLoading } = useMCPServers();

  const fetchTools = useCallback(async () => {
    // wait for servers to load first
    if (serversLoading) return;

    try {
      setError(null);
      const result = await listTools(authToken);

      // enrich tools with server information
      const enrichedTools: EnrichedTool[] = result.tools.map((tool: Tool) => {
        // find which server this tool belongs to based on prefix
        const server = servers.find((s) =>
          tool.name.startsWith(s.toolPrefix),
        );

        return {
          ...tool,
          serverName: server?.name || 'unknown',
          serverPrefix: server?.toolPrefix || '',
          fullName: tool.name,
        };
      });

      setTools(enrichedTools);
    } catch (err) {
      const errorMessage =
        err instanceof APIError
          ? err.message
          : 'Failed to fetch tools';
      setError(errorMessage);
      console.error('Error fetching MCP tools:', err);
    } finally {
      setLoading(false);
    }
  }, [authToken, servers, serversLoading]);

  // fetch when servers are ready
  useEffect(() => {
    if (!serversLoading) {
      fetchTools();
    }
  }, [fetchTools, serversLoading]);

  return {
    tools,
    loading: loading || serversLoading,
    error,
    refresh: fetchTools,
  };
}
