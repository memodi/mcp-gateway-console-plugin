// server status table component

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from '@patternfly/react-table';
import {
  Label,
  Tooltip,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InProgressIcon,
} from '@patternfly/react-icons';
import { EnrichedServer } from '../../api/types';

interface ServerStatusTableProps {
  servers: EnrichedServer[];
}

const ServerStatusTable: React.FC<ServerStatusTableProps> = ({ servers }) => {
  const { t } = useTranslation('plugin__console-plugin-template');

  // status icon and label variant mapping
  const getStatusDisplay = (status: string, lastError?: string) => {
    switch (status) {
      case 'connected':
        return {
          icon: <CheckCircleIcon />,
          variant: 'green' as const,
          label: t('Connected'),
        };
      case 'disconnected':
        return {
          icon: <ExclamationTriangleIcon />,
          variant: 'orange' as const,
          label: t('Disconnected'),
        };
      case 'error':
        return {
          icon: <ExclamationCircleIcon />,
          variant: 'red' as const,
          label: lastError || t('Error'),
        };
      case 'registering':
        return {
          icon: <InProgressIcon />,
          variant: 'blue' as const,
          label: t('Registering'),
        };
      default:
        return {
          icon: null,
          variant: 'grey' as const,
          label: status,
        };
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

export default ServerStatusTable;
