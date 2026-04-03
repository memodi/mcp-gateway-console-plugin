// create virtual mcp server modal component

import {
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CreateVirtualServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTools: string[];
  onSubmit: (name: string, namespace: string, description: string, tools: string[]) => Promise<void>;
}

export const CreateVirtualServerModal: React.FC<CreateVirtualServerModalProps> = ({
  isOpen,
  onClose,
  selectedTools,
  onSubmit,
}) => {
  const { t } = useTranslation('plugin__console-plugin-template');
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('mcp-system');
  const [description, setDescription] = useState('');
  const [manualTools, setManualTools] = useState<string[]>([]);
  const [newToolName, setNewToolName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTool = () => {
    const trimmedTool = newToolName.trim();
    if (trimmedTool && !selectedTools.includes(trimmedTool) && !manualTools.includes(trimmedTool)) {
      setManualTools([...manualTools, trimmedTool]);
      setNewToolName('');
    }
  };

  const handleRemoveTool = (tool: string) => {
    setManualTools(manualTools.filter((t) => t !== tool));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    const allTools = [...selectedTools, ...manualTools];

    try {
      await onSubmit(name, namespace, description, allTools);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create virtual MCP server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setNamespace('mcp-system');
    setDescription('');
    setManualTools([]);
    setNewToolName('');
    setError(null);
    onClose();
  };

  const isValid = name.trim().length > 0 && namespace.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} variant="small">
      <ModalHeader title={t('Create Virtual MCP Server')} />
      <ModalBody>
        <Form>
        {error && (
          <Alert variant="danger" isInline title={t('Error creating virtual server')}>
            {error}
          </Alert>
        )}

        <FormGroup label={t('Name')} isRequired fieldId="vs-name">
          <TextInput
            isRequired
            type="text"
            id="vs-name"
            name="vs-name"
            value={name}
            onChange={(_event, value) => setName(value)}
            placeholder="my-virtual-server"
          />
        </FormGroup>

        <FormGroup label={t('Namespace')} isRequired fieldId="vs-namespace">
          <TextInput
            isRequired
            type="text"
            id="vs-namespace"
            name="vs-namespace"
            value={namespace}
            onChange={(_event, value) => setNamespace(value)}
          />
        </FormGroup>

        <FormGroup label={t('Description')} fieldId="vs-description">
          <TextArea
            id="vs-description"
            name="vs-description"
            value={description}
            onChange={(_event, value) => setDescription(value)}
            rows={3}
            placeholder="Tools for development and debugging"
          />
        </FormGroup>

        <FormGroup label={t('Tools')} fieldId="vs-tools">
          <div style={{ marginBottom: '8px' }}>
            {selectedTools.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>{t('Pre-selected tools')}:</strong>
                <div style={{ marginTop: '4px', padding: '8px', backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)', borderRadius: '3px' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {selectedTools.map((tool) => (
                      <li key={tool}>
                        <code>{tool}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {manualTools.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>{t('Manually added tools')}:</strong>
                <div style={{ marginTop: '4px' }}>
                  {manualTools.map((tool) => (
                    <div
                      key={tool}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        marginBottom: '4px',
                        backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)',
                        borderRadius: '3px',
                      }}
                    >
                      <code>{tool}</code>
                      <Button
                        variant="plain"
                        onClick={() => handleRemoveTool(tool)}
                        icon={<TrashIcon />}
                        aria-label={t('Remove tool')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <TextInput
                  type="text"
                  id="new-tool"
                  name="new-tool"
                  value={newToolName}
                  onChange={(_event, value) => setNewToolName(value)}
                  placeholder={t('Enter tool name')}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTool();
                    }
                  }}
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleAddTool}
                isDisabled={!newToolName.trim()}
                icon={<PlusCircleIcon />}
              >
                {t('Add')}
              </Button>
            </div>
          </div>
        </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isDisabled={!isValid || isSubmitting}
          isLoading={isSubmitting}
        >
          {t('Create')}
        </Button>
        <Button variant="link" onClick={handleClose} isDisabled={isSubmitting}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
