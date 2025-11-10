'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Cards,
  Box,
  Badge,
  Button,
  Input,
  FormField,
  Modal,
  Alert,
  Tabs,
  ColumnLayout,
  Icon,
  TextContent
} from '@cloudscape-design/components';
import {
  getAllTemplates,
  getTemplatesByCategory,
  getTemplatesByDataType,
  searchTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  exportTemplates,
  importTemplates,
  validateTemplate,
  type QueryTemplate
} from '@/utils/osduQueryTemplates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: QueryTemplate) => void;
  currentDataType?: string;
  onClose?: () => void;
}

export const OSDUTemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  currentDataType,
  onClose
}) => {
  const [templates, setTemplates] = useState<QueryTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<QueryTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'common' | 'advanced' | 'custom'>('all');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter templates when search or category changes
  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, templates, currentDataType]);

  const loadTemplates = () => {
    const allTemplates = getAllTemplates();
    setTemplates(allTemplates);
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by current data type if specified
    if (currentDataType) {
      filtered = filtered.filter(t => t.dataType === currentDataType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchTemplates(searchQuery).filter(t => 
        (selectedCategory === 'all' || t.category === selectedCategory) &&
        (!currentDataType || t.dataType === currentDataType)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleSelectTemplate = (template: QueryTemplate) => {
    onSelectTemplate(template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this custom template?')) {
      try {
        deleteCustomTemplate(templateId);
        loadTemplates();
      } catch (error) {
        alert(`Failed to delete template: ${error.message}`);
      }
    }
  };

  const handleExportTemplates = () => {
    const customTemplates = templates.filter(t => t.isCustom);
    if (customTemplates.length === 0) {
      alert('No custom templates to export');
      return;
    }

    const json = exportTemplates(customTemplates.map(t => t.id));
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osdu-query-templates-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTemplates = () => {
    try {
      const result = importTemplates(importJson);
      setImportResult(result);
      loadTemplates();
      
      if (result.success > 0) {
        setTimeout(() => {
          setShowImportModal(false);
          setImportJson('');
          setImportResult(null);
        }, 3000);
      }
    } catch (error) {
      setImportResult({
        success: 0,
        failed: 1,
        errors: [error.message]
      });
    }
  };

  const getCategoryBadgeColor = (category: string): 'blue' | 'green' | 'grey' => {
    switch (category) {
      case 'common': return 'blue';
      case 'advanced': return 'green';
      case 'custom': return 'grey';
      default: return 'grey';
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType) {
      case 'well': return 'status-positive' as const;
      case 'wellbore': return 'status-info' as const;
      case 'log': return 'file' as const;
      case 'seismic': return 'view-full' as const;
      default: return 'search' as const;
    }
  };

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Select a pre-built template or create your own"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={handleExportTemplates}
                iconName="download"
                disabled={templates.filter(t => t.isCustom).length === 0}
              >
                Export Custom
              </Button>
              <Button
                onClick={() => setShowImportModal(true)}
                iconName="upload"
              >
                Import
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="link" iconName="close">
                  Close
                </Button>
              )}
            </SpaceBetween>
          }
        >
          Query Templates
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Search and Filter */}
        <ColumnLayout columns={2}>
          <FormField label="Search templates">
            <Input
              value={searchQuery}
              onChange={({ detail }) => setSearchQuery(detail.value)}
              placeholder="Search by name, description, or tags..."
              type="search"
              clearAriaLabel="Clear search"
            />
          </FormField>

          <FormField label="Category">
            <Tabs
              activeTabId={selectedCategory}
              onChange={({ detail }) => setSelectedCategory(detail.activeTabId as any)}
              tabs={[
                { id: 'all', label: 'All' },
                { id: 'common', label: 'Common' },
                { id: 'advanced', label: 'Advanced' },
                { id: 'custom', label: 'Custom' }
              ]}
            />
          </FormField>
        </ColumnLayout>

        {/* Template Cards */}
        {filteredTemplates.length === 0 ? (
          <Alert type="info">
            {searchQuery ? 
              `No templates found matching "${searchQuery}"` :
              selectedCategory === 'custom' ?
                'No custom templates yet. Create one by saving your current query.' :
                'No templates available for the selected filters.'
            }
          </Alert>
        ) : (
          <Cards
            cardDefinition={{
              header: (template) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Icon name={getDataTypeIcon(template.dataType)} />
                  <Box fontWeight="bold">{template.name}</Box>
                  <Badge color={getCategoryBadgeColor(template.category)}>
                    {template.category}
                  </Badge>
                </SpaceBetween>
              ),
              sections: [
                {
                  id: 'description',
                  content: (template) => (
                    <TextContent>
                      <p>{template.description}</p>
                      <Box variant="small" color="text-body-secondary">
                        <SpaceBetween direction="horizontal" size="xs">
                          <span>
                            <Icon name="status-info" /> {template.dataType}
                          </span>
                          <span>
                            <Icon name="filter" /> {template.criteria.length} {template.criteria.length === 1 ? 'criterion' : 'criteria'}
                          </span>
                        </SpaceBetween>
                      </Box>
                      {template.tags && template.tags.length > 0 && (
                        <Box margin={{ top: 'xs' }}>
                          <SpaceBetween direction="horizontal" size="xxs">
                            {template.tags.map(tag => (
                              <Badge key={tag} color="grey">{tag}</Badge>
                            ))}
                          </SpaceBetween>
                        </Box>
                      )}
                    </TextContent>
                  )
                },
                {
                  id: 'actions',
                  content: (template) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        onClick={() => handleSelectTemplate(template)}
                        variant="primary"
                        iconName="check"
                      >
                        Use Template
                      </Button>
                      {template.isCustom && (
                        <Button
                          onClick={() => handleDeleteTemplate(template.id)}
                          iconName="remove"
                        >
                          Delete
                        </Button>
                      )}
                    </SpaceBetween>
                  )
                }
              ]
            }}
            items={filteredTemplates}
            cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
          />
        )}

        {/* Template Statistics */}
        <Box variant="awsui-key-label">
          <ColumnLayout columns={4} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Total Templates</Box>
              <Box fontSize="heading-xl">{templates.length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Common</Box>
              <Box fontSize="heading-xl">{templates.filter(t => t.category === 'common').length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Advanced</Box>
              <Box fontSize="heading-xl">{templates.filter(t => t.category === 'advanced').length}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Custom</Box>
              <Box fontSize="heading-xl">{templates.filter(t => t.category === 'custom').length}</Box>
            </div>
          </ColumnLayout>
        </Box>
      </SpaceBetween>

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        onDismiss={() => {
          setShowImportModal(false);
          setImportJson('');
          setImportResult(null);
        }}
        header="Import Templates"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setShowImportModal(false);
                  setImportJson('');
                  setImportResult(null);
                }}
                variant="link"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImportTemplates}
                variant="primary"
                disabled={!importJson.trim()}
              >
                Import
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField
            label="Template JSON"
            description="Paste the exported template JSON here"
          >
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[{"name": "My Template", "dataType": "well", ...}]'
              rows={10}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </FormField>

          {importResult && (
            <Alert
              type={importResult.failed === 0 ? 'success' : importResult.success > 0 ? 'warning' : 'error'}
              header={
                importResult.failed === 0
                  ? `Successfully imported ${importResult.success} template(s)`
                  : `Imported ${importResult.success} template(s), ${importResult.failed} failed`
              }
            >
              {importResult.errors.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {importResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
        </SpaceBetween>
      </Modal>
    </Container>
  );
};
