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
  Label,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { WrenchIcon } from '@patternfly/react-icons';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from '@patternfly/react-table';
import { useMCPTools } from '../hooks';
import { EnrichedTool } from '../api/types';
import { setAPIConfig } from '../api/client';


// configure api to use mock broker for development
if (window.location.hostname === 'localhost') {
  setAPIConfig.setBrokerBaseUrl('http://localhost:8080/api/mcp');
}

// tools table component (inlined)
const ToolsTable: React.FC<{ tools: EnrichedTool[] }> = ({ tools }) => {
  const { t } = useTranslation('plugin__console-plugin-template');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getRequiredParams = (tool: EnrichedTool): string[] => {
    return tool.inputSchema.required || [];
  };

  const getParamCount = (tool: EnrichedTool): number => {
    return Object.keys(tool.inputSchema.properties || {}).length;
  };

  return (
    <Table variant="compact">
      <Thead>
        <Tr>
          <Th />
          <Th>{t('Tool Name')}</Th>
          <Th>{t('Server')}</Th>
          <Th>{t('Description')}</Th>
          <Th>{t('Parameters')}</Th>
        </Tr>
      </Thead>
      {tools.map((tool, index) => {
        const isExpanded = expandedRows.has(index);
        const requiredParams = getRequiredParams(tool);
        const paramCount = getParamCount(tool);

        return (
          <Tbody key={tool.fullName} isExpanded={isExpanded}>
            <Tr>
              <Td
                expand={{
                  rowIndex: index,
                  isExpanded,
                  onToggle: () => handleToggle(index),
                }}
              />
              <Td dataLabel={t('Tool Name')}>
                <code>{tool.fullName}</code>
              </Td>
              <Td dataLabel={t('Server')}>
                <Label color="blue">{tool.serverName}</Label>
              </Td>
              <Td dataLabel={t('Description')}>
                {tool.description || <em>{t('No description')}</em>}
              </Td>
              <Td dataLabel={t('Parameters')}>
                {paramCount > 0 ? (
                  <>
                    {paramCount} {requiredParams.length > 0 && (
                      <Label color="orange" isCompact>
                        {requiredParams.length} {t('required')}
                      </Label>
                    )}
                  </>
                ) : (
                  <em>{t('None')}</em>
                )}
              </Td>
            </Tr>

            <Tr isExpanded={isExpanded}>
              <Td colSpan={5}>
                <ExpandableRowContent>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Full Name')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <code>{tool.fullName}</code>
                      </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Server Name')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {tool.serverName}
                      </DescriptionListDescription>
                    </DescriptionListGroup>

                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Tool Prefix')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <code>{tool.serverPrefix}</code>
                      </DescriptionListDescription>
                    </DescriptionListGroup>

                    {tool.description && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {tool.description}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}

                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Input Schema')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <CodeBlock>
                          <CodeBlockCode>
                            {JSON.stringify(tool.inputSchema, null, 2)}
                          </CodeBlockCode>
                        </CodeBlock>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </ExpandableRowContent>
              </Td>
            </Tr>
          </Tbody>
        );
      })}
    </Table>
  );
};

// main tools list component
const MCPToolsList: React.FC = () => {
  const { t } = useTranslation('plugin__console-plugin-template');
  const { tools, loading, error, refresh } = useMCPTools();
  const [searchValue, setSearchValue] = useState('');

  const filteredTools = tools.filter((tool) => {
    const searchLower = searchValue.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.serverName.toLowerCase().includes(searchLower) ||
      tool.description?.toLowerCase().includes(searchLower)
    );
  });

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

  return (
    <>
      <DocumentTitle>{t('MCP Tools')}</DocumentTitle>
      <ListPageHeader title={t('MCP Tools')} />

      <PageSection>
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
