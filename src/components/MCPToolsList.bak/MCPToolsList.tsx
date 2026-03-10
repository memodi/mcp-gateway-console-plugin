// mcp tools list component

import React, { useState } from 'react';
import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import {
  PageSection,
  Spinner,
  Alert,
  Button,
  EmptyState,
  EmptyStateBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
} from '@patternfly/react-core';
import { WrenchIcon } from '@patternfly/react-icons';
import { useMCPTools } from '../../hooks';
import ToolsTable from './ToolsTable';
import './mcp-tools-list.css';

const MCPToolsList: React.FC = () => {
  const { t } = useTranslation('plugin__console-plugin-template');
  const { tools, loading, error, refresh } = useMCPTools();
  const [searchValue, setSearchValue] = useState('');

  // filter tools based on search
  const filteredTools = tools.filter((tool) => {
    const searchLower = searchValue.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.serverName.toLowerCase().includes(searchLower) ||
      tool.description?.toLowerCase().includes(searchLower)
    );
  });

  // loading state
  if (loading) {
    return (
      <>
        <DocumentTitle>{t('MCP Tools')}</DocumentTitle>
        <ListPageHeader title={t('MCP Tools')} />
        <PageSection>
          <Spinner size="lg" />
        </PageSection>
      </>
    );
  }

  // error state
  if (error) {
    return (
      <>
        <DocumentTitle>{t('MCP Tools')}</DocumentTitle>
        <ListPageHeader title={t('MCP Tools')} />
        <PageSection>
          <Alert
            variant="danger"
            isInline
            title={t('Failed to load MCP tools')}
            actionLinks={
              <Button variant="link" onClick={refresh}>
                {t('Retry')}
              </Button>
            }
          >
            {error}
          </Alert>
        </PageSection>
      </>
    );
  }

  // empty state
  if (tools.length === 0) {
    return (
      <>
        <DocumentTitle>{t('MCP Tools')}</DocumentTitle>
        <ListPageHeader title={t('MCP Tools')} />
        <PageSection>
          <EmptyState
            titleText={t('No tools available')}
            icon={WrenchIcon}
            headingLevel="h4"
          >
            <EmptyStateBody>
              {t('No tools are currently registered. Connect MCP servers to see available tools.')}
            </EmptyStateBody>
          </EmptyState>
        </PageSection>
      </>
    );
  }

  // main content
  return (
    <>
      <DocumentTitle>{t('MCP Tools')}</DocumentTitle>
      <ListPageHeader title={t('MCP Tools')} />

      <PageSection>
        {/* toolbar with search */}
        <Toolbar id="tools-toolbar">
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                placeholder={t('Search tools...')}
                value={searchValue}
                onChange={(_event: unknown, value: string) => setSearchValue(value)}
                onClear={() => setSearchValue('')}
              />
            </ToolbarItem>
            <ToolbarItem>
              <div className="mcp-tools-list__count">
                {t('{{count}} tool', { count: filteredTools.length })}
              </div>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {/* tools table */}
        {filteredTools.length === 0 ? (
          <EmptyState
            titleText={t('No matching tools found')}
            icon={WrenchIcon}
            headingLevel="h4"
          >
            <EmptyStateBody>
              {t('No tools match your search criteria.')}
            </EmptyStateBody>
            <Button variant="link" onClick={() => setSearchValue('')}>
              {t('Clear search')}
            </Button>
          </EmptyState>
        ) : (
          <ToolsTable tools={filteredTools} />
        )}
      </PageSection>
    </>
  );
};

export default MCPToolsList;
