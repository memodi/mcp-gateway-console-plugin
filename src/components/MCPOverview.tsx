// mcp gateway overview dashboard

import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Grid,
  GridItem,
  Label,
  PageSection,
  Spinner,
  Tooltip,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ServerIcon,
  WrenchIcon,
} from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { setAPIConfig } from '../api/client';
import { EnrichedServer } from '../api/types';
import { useMCPServers, useMCPTools } from '../hooks';
import './mcp-gateway.css';

// configure api to use mock broker for development
if (window.location.hostname === 'localhost') {
  setAPIConfig.setBrokerBaseUrl('http://localhost:8080/api/mcp');
}

// server status table component (inlined)
const ServerStatusTable: React.FC<{ servers: EnrichedServer[] }> = ({ servers }) => {
  const { t } = useTranslation('plugin__console-plugin-template');

  const getStatusDisplay = (ready: boolean, message: string) => {
    if (ready) {
      return { icon: <CheckCircleIcon />, variant: 'green' as const, label: t('Ready') };
    } else {
      return { icon: <ExclamationCircleIcon />, variant: 'red' as const, label: message };
    }
  };

  return (
    <Table variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Server Name')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Tool Count')}</Th>
          <Th>{t('Last Validated')}</Th>
          <Th>{t('ID')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {servers.map((server) => {
          const statusDisplay = getStatusDisplay(server.ready, server.message);
          const lastValidated = new Date(server.lastValidated).toLocaleString();
          return (
            <Tr key={server.id}>
              <Td dataLabel={t('Server Name')}>
                <Link
                  to={`/mcp-gateway/tools?server=${encodeURIComponent(server.name)}`}
                  className="mcp-server-link"
                >
                  {server.name}
                </Link>
              </Td>
              <Td dataLabel={t('Status')}>
                {!server.ready ? (
                  <Tooltip content={server.message}>
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
              <Td dataLabel={t('Tool Count')}>{server.totalTools}</Td>
              <Td dataLabel={t('Last Validated')}>{lastValidated}</Td>
              <Td dataLabel={t('ID')}>
                <code className="mcp-overview__url">{server.id}</code>
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
  const {
    servers,
    loading: serversLoading,
    error: serversError,
    refresh,
  } = useMCPServers(true, 30000);
  const { tools, loading: toolsLoading } = useMCPTools(true, 30000);

  const readyServers = servers.filter((s) => s.ready).length;
  const notReadyServers = servers.filter((s) => !s.ready).length;
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
        <Grid hasGutter span={12} md={6} lg={3} className="mcp-overview__metrics">
          <GridItem>
            <Card className="mcp-overview__metric-card">
              <CardTitle className="mcp-overview__metric-title">
                <ServerIcon /> {t('Total Servers')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric-value">{servers.length}</div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card className="mcp-overview__metric-card">
              <CardTitle className="mcp-overview__metric-title">
                <CheckCircleIcon /> {t('Ready')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric-value">{readyServers}</div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card className="mcp-overview__metric-card">
              <CardTitle className="mcp-overview__metric-title">
                <ExclamationCircleIcon /> {t('Not Ready')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric-value">{notReadyServers}</div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card className="mcp-overview__metric-card">
              <CardTitle className="mcp-overview__metric-title">
                <WrenchIcon /> {t('Available Tools')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric-value">
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
