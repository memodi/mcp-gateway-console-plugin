// custom hook for fetching mcp virtual servers from kubernetes

import { useState, useEffect, useCallback } from 'react';
import { listMCPVirtualServers } from '../api/k8s';
import { MCPVirtualServer } from '../api/types';

interface UseMCPVirtualServersResult {
  virtualServers: MCPVirtualServer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage MCP virtual servers from Kubernetes
 *
 * This hook fetches all MCPVirtualServer resources cluster-wide and
 * provides a mapping of tools to virtual servers for filtering.
 *
 * Usage:
 * ```tsx
 * function ToolsList() {
 *   const { virtualServers, loading } = useMCPVirtualServers(true, 15000);
 *
 *   return <div>Found {virtualServers.length} virtual servers</div>;
 * }
 * ```
 */
export function useMCPVirtualServers(
  autoRefresh = false,
  refreshInterval = 15000,
): UseMCPVirtualServersResult {
  const [virtualServers, setVirtualServers] = useState<MCPVirtualServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVirtualServers = useCallback(async () => {
    try {
      setError(null);
      const servers = await listMCPVirtualServers();
      setVirtualServers(servers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch virtual servers';
      setError(errorMessage);
      console.error('Error fetching MCP virtual servers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // fetch on mount
  useEffect(() => {
    fetchVirtualServers();
  }, [fetchVirtualServers]);

  // auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchVirtualServers, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchVirtualServers]);

  return {
    virtualServers,
    loading,
    error,
    refresh: fetchVirtualServers,
  };
}
