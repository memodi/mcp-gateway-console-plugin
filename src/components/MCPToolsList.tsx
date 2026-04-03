// mcp tools list component

import { DocumentTitle, ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  Label,
  LabelGroup,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { WrenchIcon } from '@patternfly/react-icons';
import { ExpandableRowContent, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { setAPIConfig } from '../api/client';
import { createMCPVirtualServer } from '../api/k8s';
import { EnrichedTool } from '../api/types';
import { useMCPTools } from '../hooks';
import { CreateVirtualServerModal } from './CreateVirtualServerModal';
import './mcp-gateway.css';

// configure api to use mock broker for development
if (window.location.hostname === 'localhost') {
  setAPIConfig.setBrokerBaseUrl('http://localhost:8080/api/mcp');
}

// tools table component (inlined)
const ToolsTable: React.FC<{
  tools: EnrichedTool[];
  selectedTools: string[];
  onToolSelectionChange: (toolNames: string[]) => void;
  onVirtualServerClick?: (vs: string) => void;
}> = ({ tools, selectedTools, onToolSelectionChange, onVirtualServerClick }) => {
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

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      onToolSelectionChange(tools.map((tool) => tool.fullName));
    } else {
      onToolSelectionChange([]);
    }
  };

  const handleSelectTool = (toolName: string, isSelected: boolean) => {
    if (isSelected) {
      onToolSelectionChange([...selectedTools, toolName]);
    } else {
      onToolSelectionChange(selectedTools.filter((t) => t !== toolName));
    }
  };

  const areAllSelected = tools.length > 0 && selectedTools.length === tools.length;
  const areSomeSelected = selectedTools.length > 0 && selectedTools.length < tools.length;

  return (
    <Table variant="compact">
      <Thead>
        <Tr>
          <Th
            select={{
              onSelect: (_event, isSelected) => handleSelectAll(isSelected),
              isSelected: areAllSelected,
              isHeaderSelectDisabled: tools.length === 0,
            }}
          />
          <Th />
          <Th>{t('Tool Name')}</Th>
          <Th>{t('Server')}</Th>
          <Th>{t('Virtual Servers')}</Th>
          <Th>{t('Description')}</Th>
          <Th>{t('Parameters')}</Th>
        </Tr>
      </Thead>
      {tools.map((tool, index) => {
        const isExpanded = expandedRows.has(index);
        const requiredParams = getRequiredParams(tool);
        const paramCount = getParamCount(tool);

        const isSelected = selectedTools.includes(tool.fullName);

        return (
          <Tbody key={tool.fullName} isExpanded={isExpanded}>
            <Tr>
              <Td
                select={{
                  rowIndex: index,
                  onSelect: (_event, isSelecting) => handleSelectTool(tool.fullName, isSelecting),
                  isSelected,
                }}
              />
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
              <Td dataLabel={t('Virtual Servers')}>
                {tool.virtualServers && tool.virtualServers.length > 0 ? (
                  <LabelGroup>
                    {tool.virtualServers.map((vs) => (
                      <Label
                        key={vs}
                        color="purple"
                        isCompact
                        onClick={onVirtualServerClick ? () => onVirtualServerClick(vs) : undefined}
                        style={onVirtualServerClick ? { cursor: 'pointer' } : undefined}
                      >
                        {vs}
                      </Label>
                    ))}
                  </LabelGroup>
                ) : (
                  <em>{t('None')}</em>
                )}
              </Td>
              <Td dataLabel={t('Description')}>
                {tool.description || <em>{t('No description')}</em>}
              </Td>
              <Td dataLabel={t('Parameters')}>
                {paramCount > 0 ? (
                  <>
                    {paramCount}{' '}
                    {requiredParams.length > 0 && (
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
              <Td colSpan={7}>
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
                      <DescriptionListDescription>{tool.serverName}</DescriptionListDescription>
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
                        <DescriptionListDescription>{tool.description}</DescriptionListDescription>
                      </DescriptionListGroup>
                    )}

                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Input Schema')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <CodeBlock>
                          <CodeBlockCode>{JSON.stringify(tool.inputSchema, null, 2)}</CodeBlockCode>
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
  const location = useLocation();
  const { tools, loading, error, refresh } = useMCPTools(true, 30000);
  const [searchValue, setSearchValue] = useState('');
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [selectedVirtualServers, setSelectedVirtualServers] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCreateVSModalOpen, setIsCreateVSModalOpen] = useState(false);

  // read server filter from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const serverParam = params.get('server');
    if (serverParam) {
      setSelectedServers([serverParam]);
    }
  }, [location.search]);

  const handleCreateVirtualServer = () => {
    setIsCreateVSModalOpen(true);
    setIsActionsOpen(false);
  };

  const handleVirtualServerSubmit = async (
    name: string,
    namespace: string,
    description: string,
    tools: string[],
  ) => {
    await createMCPVirtualServer(name, namespace, description, tools);
    // clear selection after successful creation
    setSelectedTools([]);
  };

  const handleServerFilterRemove = (server: string) => {
    setSelectedServers(selectedServers.filter((s) => s !== server));
  };

  const handleVirtualServerFilterRemove = (vs: string) => {
    setSelectedVirtualServers(selectedVirtualServers.filter((s) => s !== vs));
  };

  const handleVirtualServerClick = (vs: string) => {
    if (!selectedVirtualServers.includes(vs)) {
      setSelectedVirtualServers([...selectedVirtualServers, vs]);
    }
  };

  const filteredTools = tools.filter((tool) => {
    const searchLower = searchValue.toLowerCase();
    const matchesSearch =
      tool.name.toLowerCase().includes(searchLower) ||
      tool.serverName.toLowerCase().includes(searchLower) ||
      tool.description?.toLowerCase().includes(searchLower);

    const matchesServer = selectedServers.length === 0 || selectedServers.includes(tool.serverName);

    const matchesVirtualServer =
      selectedVirtualServers.length === 0 ||
      (tool.virtualServers &&
        tool.virtualServers.some((vs) => selectedVirtualServers.includes(vs)));

    return matchesSearch && matchesServer && matchesVirtualServer;
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
          <EmptyState titleText={t('No tools available')} icon={WrenchIcon} headingLevel="h4">
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
        <Toolbar id="tools-toolbar" className="mcp-tools__toolbar">
          <ToolbarContent>
            <ToolbarGroup>
              <ToolbarItem>
                <SearchInput
                  placeholder={t('Search tools...')}
                  value={searchValue}
                  onChange={(_event: unknown, value: string) => setSearchValue(value)}
                  onClear={() => setSearchValue('')}
                />
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarItem>
              <div className="mcp-tools-list__count">
                {t('{{count}} tool', { count: filteredTools.length })}
              </div>
            </ToolbarItem>
            <ToolbarGroup align={{ default: 'alignEnd' }}>
              <ToolbarItem>
                <Dropdown
                  isOpen={isActionsOpen}
                  onSelect={() => setIsActionsOpen(false)}
                  onOpenChange={(isOpen: boolean) => setIsActionsOpen(isOpen)}
                  popperProps={{
                    position: 'right',
                  }}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsActionsOpen(!isActionsOpen)}
                      isExpanded={isActionsOpen}
                    >
                      {t('Actions')}
                    </MenuToggle>
                  )}
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem
                      key="create-vs"
                      onClick={handleCreateVirtualServer}
                      isDisabled={selectedTools.length === 0}
                    >
                      {t('Create Virtual MCP Server')}
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
          {(selectedServers.length > 0 || selectedVirtualServers.length > 0) && (
            <ToolbarContent className="mcp-tools__filter-chips">
              {selectedServers.length > 0 && (
                <ToolbarItem>
                  <LabelGroup categoryName={t('Server filter')}>
                    {selectedServers.map((server) => (
                      <Label
                        key={server}
                        color="blue"
                        onClose={() => handleServerFilterRemove(server)}
                      >
                        {server}
                      </Label>
                    ))}
                  </LabelGroup>
                </ToolbarItem>
              )}
              {selectedVirtualServers.length > 0 && (
                <ToolbarItem>
                  <LabelGroup categoryName={t('Virtual Server filter')}>
                    {selectedVirtualServers.map((vs) => (
                      <Label
                        key={vs}
                        color="purple"
                        onClose={() => handleVirtualServerFilterRemove(vs)}
                      >
                        {vs}
                      </Label>
                    ))}
                  </LabelGroup>
                </ToolbarItem>
              )}
            </ToolbarContent>
          )}
        </Toolbar>

        {filteredTools.length === 0 ? (
          <EmptyState titleText={t('No matching tools found')} icon={WrenchIcon} headingLevel="h4">
            <EmptyStateBody>{t('No tools match your search criteria.')}</EmptyStateBody>
            <Button variant="link" onClick={() => setSearchValue('')}>
              {t('Clear search')}
            </Button>
          </EmptyState>
        ) : (
          <ToolsTable
            tools={filteredTools}
            selectedTools={selectedTools}
            onToolSelectionChange={setSelectedTools}
            onVirtualServerClick={handleVirtualServerClick}
          />
        )}
      </PageSection>

      <CreateVirtualServerModal
        isOpen={isCreateVSModalOpen}
        onClose={() => setIsCreateVSModalOpen(false)}
        selectedTools={selectedTools}
        onSubmit={handleVirtualServerSubmit}
      />
    </>
  );
};

export default MCPToolsList;
