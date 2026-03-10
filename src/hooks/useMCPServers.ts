// custom hook for fetching and managing mcp servers

import { useState, useEffect, useCallback } from 'react';
import { getBrokerStatus } from '../api/client';
import { EnrichedServer, APIError } from '../api/types';

interface UseMCPServersResult {
  servers: EnrichedServer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage MCP servers from broker
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { servers, loading, error, refresh } = useMCPServers();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Alert variant="danger">{error}</Alert>;
 *
 *   return <ServerList servers={servers} />;
 * }
 * ```
 */
export function useMCPServers(
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
): UseMCPServersResult {
  const [servers, setServers] = useState<EnrichedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      setError(null);
      const status = await getBrokerStatus();

      // transform response into enriched server array
      const enrichedServers: EnrichedServer[] = Object.entries(
        status.servers,
      ).map(([name, info]) => ({
        name,
        ...info,
      }));

      setServers(enrichedServers);
    } catch (err) {
      const errorMessage =
        err instanceof APIError
          ? err.message
          : 'Failed to fetch servers';
      setError(errorMessage);
      console.error('Error fetching MCP servers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial fetch
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchServers, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchServers]);

  return {
    servers,
    loading,
    error,
    refresh: fetchServers,
  };
}
