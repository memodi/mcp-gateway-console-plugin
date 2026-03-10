// tools table component with expandable rows

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from '@patternfly/react-table';
import {
  Label,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { EnrichedTool } from '../../api/types';

interface ToolsTableProps {
  tools: EnrichedTool[];
}

const ToolsTable: React.FC<ToolsTableProps> = ({ tools }) => {
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

  // extract required parameters from schema
  const getRequiredParams = (tool: EnrichedTool): string[] => {
    return tool.inputSchema.required || [];
  };

  // get parameter count
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
            {/* main row */}
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

            {/* expanded row with schema details */}
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

export default ToolsTable;
