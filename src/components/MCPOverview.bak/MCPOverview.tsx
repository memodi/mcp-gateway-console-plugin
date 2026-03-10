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
} from '@patternfly/react-core';
import {
  ServerIcon,
  WrenchIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import { useMCPServers, useMCPTools } from '../../hooks';
import ServerStatusTable from './ServerStatusTable';
import './mcp-overview.css';

const MCPOverview: React.FC = () => {
  const { t } = useTranslation('plugin__console-plugin-template');
  const { servers, loading: serversLoading, error: serversError, refresh } = useMCPServers();
  const { tools, loading: toolsLoading } = useMCPTools();

  // calculate summary statistics
  const connectedServers = servers.filter(s => s.status === 'connected').length;
  const disconnectedServers = servers.filter(s => s.status === 'disconnected').length;
  const errorServers = servers.filter(s => s.status === 'error').length;
  const totalTools = tools.length;

  // loading state
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

  // error state
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

  // empty state
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

  // main content
  return (
    <>
      <DocumentTitle>{t('MCP Gateway')}</DocumentTitle>
      <ListPageHeader title={t('MCP Gateway Overview')} />

      <PageSection>
        {/* summary cards */}
        <Grid hasGutter span={12} md={6} lg={3}>
          {/* total servers card */}
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

          {/* connected servers card */}
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

          {/* disconnected servers card */}
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

          {/* error servers card */}
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

          {/* total tools card */}
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

        {/* server status table */}
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
