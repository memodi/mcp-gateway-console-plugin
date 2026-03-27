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
                <strong>{server.name}</strong>
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
              <Td dataLabel={t('Tool Count')}>
                {server.totalTools}
              </Td>
              <Td dataLabel={t('Last Validated')}>
                {lastValidated}
              </Td>
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
  const { servers, loading: serversLoading, error: serversError, refresh } = useMCPServers();
  const { tools, loading: toolsLoading } = useMCPTools();

  const readyServers = servers.filter(s => s.ready).length;
  const notReadyServers = servers.filter(s => !s.ready).length;
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
                <CheckCircleIcon className="mcp-overview__icon--success" /> {t('Ready')}
              </CardTitle>
              <CardBody>
                <div className="mcp-overview__metric mcp-overview__metric--success">
                  {readyServers}
                </div>
              </CardBody>
            </Card>
          </GridItem>

          {notReadyServers > 0 && (
            <GridItem>
              <Card>
                <CardTitle>
                  <ExclamationCircleIcon className="mcp-overview__icon--danger" /> {t('Not Ready')}
                </CardTitle>
                <CardBody>
                  <div className="mcp-overview__metric mcp-overview__metric--danger">
                    {notReadyServers}
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
