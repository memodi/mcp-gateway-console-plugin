// mcp gateway overview dashboard

import React from 'react';
import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import {
  PageSection,
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Spinner,
  Alert,
  EmptyState,
  EmptyStateBody,
  Button,
  Label,
  Tooltip,
} from '@patternfly/react-core';
import {
  ServerIcon,
  WrenchIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InProgressIcon,
} from '@patternfly/react-icons';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import { useMCPServers, useMCPTools } from '../hooks';
import { EnrichedServer } from '../api/types';
import { setAPIConfig } from '../api/client';
import './MCPOverview.bak/mcp-overview.css';

// configure api to use mock broker for development
if (window.location.hostname === 'localhost') {
  setAPIConfig.setBrokerBaseUrl('http://localhost:8080/api/mcp');
}

// server status table component (inlined)
const ServerStatusTable: React.FC<{ servers: EnrichedServer[] }> = ({ servers }) => {
  const { t } = useTranslation('plugin__console-plugin-template');

  const getStatusDisplay = (status: string, lastError?: string) => {
    switch (status) {
      case 'connected':
        return { icon: <CheckCircleIcon />, variant: 'green' as const, label: t('Connected') };
      case 'disconnected':
        return { icon: <ExclamationTriangleIcon />, variant: 'orange' as const, label: t('Disconnected') };
      case 'error':
        return { icon: <ExclamationCircleIcon />, variant: 'red' as const, label: lastError || t('Error') };
      case 'registering':
        return { icon: <InProgressIcon />, variant: 'blue' as const, label: t('Registering') };
      default:
        return { icon: null, variant: 'grey' as const, label: status };
    }
  };

  return (
    <Table variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Server Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Tool Prefix')}</Th>
          <Th>{t('Tool Count')}</Th>
          <Th>{t('URL')}</Th>
          <Th>{t('Authentication')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {servers.map((server) => {
          const statusDisplay = getStatusDisplay(server.status, server.lastError);
          return (
            <Tr key={server.name}>
              <Td dataLabel={t('Server Name')}>
                <strong>{server.name}</strong>
              </Td>
              <Td dataLabel={t('Status')}>
                {server.lastError ? (
                  <Tooltip content={server.lastError}>
                    <Label icon={statusDisplay.icon} color={statusDisplay.variant}>
                      {statusDisplay.label}
                    </Label>
                  </Tooltip>
                ) : (
                  <Label icon={statusDisplay.icon} color={statusDisplay.variant}>
                    {statusDisplay.label}
                  </Label>
                )}
              </Td>
              <Td dataLabel={t('Tool Prefix')}>
                <code>{server.toolPrefix}</code>
              </Td>
              <Td dataLabel={t('Tool Count')}>
                {server.toolCount}
              </Td>
              <Td dataLabel={t('URL')}>
                <code className="mcp-overview__url">{server.url}</code>
              </Td>
              <Td dataLabel={t('Authentication')}>
                {server.credentials ? (
                  <Label color="blue">{t('Enabled')}</Label>
                ) : (
                  <Label color="grey">{t('None')}</Label>
                )}
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

// main overview component
const MCPOverview: React.FC = () => {
  const { t } = useTranslation('plugin__console-plugin-template');
  const { servers, loading: serversLoading, error: serversError, refresh } = useMCPServers();
  const { tools, loading: toolsLoading } = useMCPTools();

  const connectedServers = servers.filter(s => s.status === 'connected').length;
  const disconnectedServers = servers.filter(s => s.status === 'disconnected').length;
  const errorServers = servers.filter(s => s.status === 'error').length;
  const totalTools = tools.length;

  if (serversLoading) {
    return (
      <>
        <DocumentTitle>{t('MCP Gateway')}</DocumentTitle>
        <ListPageHeader title={t('MCP Gateway Overview')} />
        <PageSection>
          <Spinner size="lg" />
        </PageSection>
      </>
    );
  }

  if (serversError) {
    return (
      <>
        <DocumentTitle>{t('MCP Gateway')}</DocumentTitle>
        <ListPageHeader title={t('MCP Gateway Overview')} />
        <PageSection>
          <Alert
            variant="danger"
            isInline
            title={t('Failed to load MCP servers')}
            actionLinks={
              <Button variant="link" onClick={refresh}>
                {t('Retry')}
              </Button>
            }
          >
            {serversError}
          </Alert>
        </PageSection>
      </>
    );
  }

  if (servers.length === 0) {
    return (
      <>
        <DocumentTitle>{t('MCP Gateway')}</DocumentTitle>
        <ListPageHeader title={t('MCP Gateway Overview')} />
        <PageSection>
          <EmptyState
            titleText={t('No MCP servers registered')}
            icon={ServerIcon}
            headingLevel="h4"
          >
            <EmptyStateBody>
              {t('Create an MCPServerRegistration resource to connect MCP servers to the gateway.')}
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      </>
    );
  }

  return (
    <>
      <DocumentTitle>{t('MCP Gateway')}</DocumentTitle>
      <ListPageHeader title={t('MCP Gateway Overview')} />

      <PageSection>
        <Grid hasGutter span={12} md={6} lg={3}>
          <GridItem>
            <Card>
              <CardTitle>
                <ServerIcon /> {t('Total Servers')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric">
                  {servers.length}
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card>
              <CardTitle>
                <CheckCircleIcon className="mcp-overview__icon--success" /> {t('Connected')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric mcp-overview__metric--success">
                  {connectedServers}
                </div>
              </CardBody>
            </Card>
          </GridItem>

          {disconnectedServers > 0 && (
            <GridItem>
              <Card>
                <CardTitle>
                  <ExclamationTriangleIcon className="mcp-overview__icon--warning" /> {t('Disconnected')}
                </CardTitle>
                <CardBody>
                  <div className="mcp-overview__metric mcp-overview__metric--warning">
                    {disconnectedServers}
                  </div>
                </CardBody>
              </Card>
            </GridItem>
          )}

          {errorServers > 0 && (
            <GridItem>
              <Card>
                <CardTitle>
                  <ExclamationCircleIcon className="mcp-overview__icon--danger" /> {t('Error')}
                </CardTitle>
                <CardBody>
                  <div className="mcp-overview__metric mcp-overview__metric--danger">
                    {errorServers}
                  </div>
                </CardBody>
              </Card>
            </GridItem>
          )}

          <GridItem>
            <Card>
              <CardTitle>
                <WrenchIcon /> {t('Available Tools')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric">
                  {toolsLoading ? <Spinner size="md" /> : totalTools}
                </div>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        <Card className="mcp-overview__table-card">
          <CardTitle>{t('Server Status')}</CardTitle>
          <CardBody>
            <ServerStatusTable servers={servers} />
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export default MCPOverview;
