// kubernetes api client for MCPVirtualServer resources

import { k8sCreate, k8sList } from '@openshift-console/dynamic-plugin-sdk';
import type { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { MCPVirtualServer } from './types';

const MCPVirtualServerModel: K8sModel = {
  apiVersion: 'v1alpha1',
  apiGroup: 'mcp.kuadrant.io',
  kind: 'MCPVirtualServer',
  plural: 'mcpvirtualservers',
  abbr: 'MCPVS',
  label: 'MCP Virtual Server',
  labelPlural: 'MCP Virtual Servers',
  namespaced: true,
  crd: true,
};

export async function createMCPVirtualServer(
  name: string,
  namespace: string,
  description: string,
  tools: string[],
): Promise<MCPVirtualServer> {
  const resource: MCPVirtualServer = {
    apiVersion: 'mcp.kuadrant.io/v1alpha1',
    kind: 'MCPVirtualServer',
    metadata: {
      name,
      namespace,
    },
    spec: {
      description: description || undefined,
      tools,
    },
  };

  return k8sCreate({
    model: MCPVirtualServerModel,
    data: resource,
  });
}

export async function listMCPVirtualServers(): Promise<MCPVirtualServer[]> {
  try {
    const result = await k8sList({
      model: MCPVirtualServerModel,
      queryParams: {},
    });
    // k8sList can return either an array or an object with items property
    if (Array.isArray(result)) {
      return result as MCPVirtualServer[];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((result as any)?.items || []) as MCPVirtualServer[];
  } catch (error) {
    console.error('Failed to list MCP virtual servers:', error);
    return [];
  }
}
