// API type definitions for MCP Gateway

// broker /status endpoint response
export interface BrokerStatusResponse {
  servers: {
    [serverName: string]: ServerInfo;
  };
}

export interface ServerInfo {
  url: string;
  status: 'connected' | 'disconnected' | 'error' | 'registering';
  toolPrefix: string;
  toolCount: number;
  lastError?: string;
  credentials?: boolean;
}

// mcp protocol types
export interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: number | string;
}

export interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: MCPError;
  id: number | string;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

// tools/list response
export interface ToolsListResult {
  tools: Tool[];
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: {
      [key: string]: unknown;
    };
    required?: string[];
  };
}

// tools/call request
export interface ToolCallParams {
  name: string;
  arguments?: {
    [key: string]: unknown;
  };
}

// tools/call response
export interface ToolCallResult {
  content: ContentItem[];
  isError?: boolean;
}

export interface ContentItem {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

// enriched types for ui display
export interface EnrichedServer extends ServerInfo {
  name: string;
  tools?: Tool[];
}

export interface EnrichedTool extends Tool {
  serverName: string;
  serverPrefix: string;
  fullName: string; // with prefix
}

// api error type
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}
