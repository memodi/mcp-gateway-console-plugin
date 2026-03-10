// API client for MCP Gateway broker

import {
  BrokerStatusResponse,
  MCPRequest,
  MCPResponse,
  ToolsListResult,
  ToolCallParams,
  ToolCallResult,
  APIError,
} from './types';

// configuration for api endpoints
const API_CONFIG = {
  // default to /api/mcp, can be changed via setAPIConfig
  brokerBaseUrl: '/api/mcp',
  statusEndpoint: '/status',
  mcpEndpoint: '/mcp',
};

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new APIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Make an MCP protocol request
 */
async function mcpRequest<T>(
  method: string,
  params?: unknown,
  authToken?: string,
): Promise<T> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(), // simple id generation
  };

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetchAPI<MCPResponse<T>>(
    `${API_CONFIG.brokerBaseUrl}${API_CONFIG.mcpEndpoint}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    },
  );

  if (response.error) {
    throw new APIError(
      `MCP Error: ${response.error.message}`,
      response.error.code,
      response.error.data,
    );
  }

  if (!response.result) {
    throw new APIError('MCP response missing result');
  }

  return response.result;
}

/**
 * Get broker status (registered servers)
 */
export async function getBrokerStatus(): Promise<BrokerStatusResponse> {
  return fetchAPI<BrokerStatusResponse>(
    `${API_CONFIG.brokerBaseUrl}${API_CONFIG.statusEndpoint}`,
  );
}

/**
 * List all available tools
 * @param authToken - optional user token for authorization filtering
 */
export async function listTools(
  authToken?: string,
): Promise<ToolsListResult> {
  return mcpRequest<ToolsListResult>('tools/list', undefined, authToken);
}

/**
 * Call a specific tool
 * @param toolName - name of the tool (with or without prefix)
 * @param args - tool arguments
 * @param authToken - optional user token for authorization
 */
export async function callTool(
  toolName: string,
  args?: Record<string, unknown>,
  authToken?: string,
): Promise<ToolCallResult> {
  const params: ToolCallParams = {
    name: toolName,
    arguments: args,
  };

  return mcpRequest<ToolCallResult>('tools/call', params, authToken);
}

/**
 * Initialize MCP session (handshake)
 * This may be needed depending on broker implementation
 */
export async function initializeSession(
  clientInfo?: {
    name: string;
    version: string;
  },
): Promise<void> {
  await mcpRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
    },
    clientInfo: clientInfo || {
      name: 'mcp-gateway-console',
      version: '1.0.0',
    },
  });
}

/**
 * Configuration setters for testing/development
 */
export const setAPIConfig = {
  setBrokerBaseUrl: (url: string) => {
    API_CONFIG.brokerBaseUrl = url;
  },
  setStatusEndpoint: (path: string) => {
    API_CONFIG.statusEndpoint = path;
  },
  setMCPEndpoint: (path: string) => {
    API_CONFIG.mcpEndpoint = path;
  },
};
