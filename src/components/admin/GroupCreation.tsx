import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Alert,
  Button,
  FormField,
  Input,
  Textarea,
  Select,
  ColumnLayout,
  Cards,
  Badge
} from '@cloudscape-design/components';
import osduApi from '../../services/osduApiService';

interface GroupCreationProps {
  dataPartition?: string;
  onGroupCreated?: (group: any) => void;
}

const GroupCreation: React.FC<GroupCreationProps> = ({ 
  dataPartition = 'osdu',
  onGroupCreated 
}) => {
  const [formData, setFormData] = useState({
    groupType: { label: 'Service Group', value: 'service' },
    serviceName: '',
    permission: { label: 'Admin', value: 'admin' },
    customName: '',
    description: '',
    useCustomName: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  const groupTypeOptions = [
    { label: 'Service Group', value: 'service', description: 'Groups for service access control' },
    { label: 'Data Group', value: 'data', description: 'Groups for data access control' },
    { label: 'User Group', value: 'users', description: 'Groups for user management' }
  ];

  const serviceOptions = [
    { label: 'Schema Service', value: 'schema' },
    { label: 'Storage Service', value: 'storage' },
    { label: 'Search Service', value: 'search' },
    { label: 'Legal Tagging Service', value: 'legal' },
    { label: 'Entitlements Service', value: 'entitlements' },
    { label: 'AI Service', value: 'ai' },
    { label: 'Data Ingestion Service', value: 'data-ingestion' },
    { label: 'Seismic Ingestion Service', value: 'seismic-ingestion' }
  ];

  const permissionOptions = [
    { label: 'Admin', value: 'admin', description: 'Full administrative access' },
    { label: 'User', value: 'user', description: 'Standard user access' },
    { label: 'Viewers', value: 'viewers', description: 'Read-only access' },
    { label: 'Editors', value: 'editors', description: 'Read and write access' },
    { label: 'Owners', value: 'owners', description: 'Full ownership rights' }
  ];

  // Update preview name when form data changes
  React.useEffect(() => {
    if (formData.useCustomName) {
      setPreviewName(formData.customName);
    } else {
      const name = `${formData.groupType.value}.${formData.serviceName}.${formData.permission.value}@${dataPartition}.dataservices.energy`;
      setPreviewName(name);
    }
  }, [formData, dataPartition]);

  const handleCreateGroup = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.useCustomName && !formData.serviceName) {
        throw new Error('Service name is required');
      }
      
      if (formData.useCustomName && !formData.customName.trim()) {
        throw new Error('Custom group name is required');
      }

      const groupName = formData.useCustomName 
        ? formData.customName.trim()
        : `${formData.groupType.value}.${formData.serviceName}.${formData.permission.value}@${dataPartition}.dataservices.energy`;

      // Validate group name format
      osduApi.validateGroupName(groupName);

      const result = await osduApi.createGroup({
        name: groupName,
        description: formData.description.trim() || `${formData.groupType.label} for ${formData.serviceName || 'custom'} with ${formData.permission.label} permissions`
      }, dataPartition);

      setSuccess(`Group "${groupName}" created successfully!`);
      
      // Reset form
      setFormData({
        groupType: { label: 'Service Group', value: 'service' },
        serviceName: '',
        permission: { label: 'Admin', value: 'admin' },
        customName: '',
        description: '',
        useCustomName: false
      });

      // Notify parent component
      if (onGroupCreated) {
        onGroupCreated(result);
      }

    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const validateGroupName = (name: string) => {
    try {
      osduApi.validateGroupName(name);
      return { valid: true, message: 'Valid OSDU group name' };
    } catch (err: any) {
      return { valid: false, message: err.message };
    }
  };

  const nameValidation = validateGroupName(previewName);

  const commonGroupTemplates = [
    {
      name: 'Schema Admin',
      groupName: `service.schema.admin@${dataPartition}.dataservices.energy`,
      description: 'Full administrative access to schema service',
      type: 'service'
    },
    {
      name: 'Storage Admin',
      groupName: `service.storage.admin@${dataPartition}.dataservices.energy`,
      description: 'Full administrative access to storage service',
      type: 'service'
    },
    {
      name: 'Search Admin',
      groupName: `service.search.admin@${dataPartition}.dataservices.energy`,
      description: 'Full administrative access to search service',
      type: 'service'
    },
    {
      name: 'Legal Admin',
      groupName: `service.legal.admin@${dataPartition}.dataservices.energy`,
      description: 'Full administrative access to legal tagging service',
      type: 'service'
    },
    {
      name: 'Data Viewers',
      groupName: `data.default.viewers@${dataPartition}.dataservices.energy`,
      description: 'Read-only access to default data',
      type: 'data'
    },
    {
      name: 'Data Owners',
      groupName: `data.default.owners@${dataPartition}.dataservices.energy`,
      description: 'Full ownership rights to default data',
      type: 'data'
    }
  ];

  const useTemplate = (template: any) => {
    setFormData({
      ...formData,
      customName: template.groupName,
      description: template.description,
      useCustomName: true
    });
  };

  return (
    <Container
      header={
        <Header variant="h2">
          Create New Group
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert type="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Group Templates */}
        <Container header={<Header variant="h3">Quick Templates</Header>}>
          <Cards
            cardDefinition={{
              header: (item: any) => item.name,
              sections: [
                {
                  id: 'groupName',
                  header: 'Group Name',
                  content: (item: any) => (
                    <Box fontSize="body-s" fontFamily="monospace">
                      {item.groupName}
                    </Box>
                  )
                },
                {
                  id: 'description',
                  header: 'Description',
                  content: (item: any) => item.description
                },
                {
                  id: 'actions',
                  content: (item: any) => (
                    <Button
                      size="small"
                      onClick={() => useTemplate(item)}
                    >
                      Use Template
                    </Button>
                  )
                }
              ]
            }}
            items={commonGroupTemplates}
            trackBy="groupName"
            variant="container"
          />
        </Container>

        {/* Group Creation Form */}
        <Container header={<Header variant="h3">Custom Group Creation</Header>}>
          <SpaceBetween direction="vertical" size="l">
            <FormField
              label="Creation Method"
              description="Choose how to create the group name"
            >
              <SpaceBetween direction="vertical" size="s">
                <label>
                  <input
                    type="radio"
                    checked={!formData.useCustomName}
                    onChange={() => setFormData(prev => ({ ...prev, useCustomName: false }))}
                  />
                  {' '}Build from components (recommended)
                </label>
                <label>
                  <input
                    type="radio"
                    checked={formData.useCustomName}
                    onChange={() => setFormData(prev => ({ ...prev, useCustomName: true }))}
                  />
                  {' '}Enter custom name
                </label>
              </SpaceBetween>
            </FormField>

            {!formData.useCustomName ? (
              <ColumnLayout columns={3}>
                <FormField
                  label="Group Type"
                  description="Type of group to create"
                >
                  <Select
                    selectedOption={formData.groupType}
                    onChange={({ detail }) => 
                      setFormData(prev => ({ ...prev, groupType: detail.selectedOption }))
                    }
                    options={groupTypeOptions}
                  />
                </FormField>

                <FormField
                  label="Service Name"
                  description="Target service for the group"
                >
                  <Select
                    selectedOption={formData.serviceName ? {
                      label: serviceOptions.find(s => s.value === formData.serviceName)?.label || formData.serviceName,
                      value: formData.serviceName
                    } : null}
                    onChange={({ detail }) => 
                      setFormData(prev => ({ ...prev, serviceName: detail.selectedOption.value }))
                    }
                    options={serviceOptions}
                    placeholder="Choose service"
                  />
                </FormField>

                <FormField
                  label="Permission Level"
                  description="Access level for group members"
                >
                  <Select
                    selectedOption={formData.permission}
                    onChange={({ detail }) => 
                      setFormData(prev => ({ ...prev, permission: detail.selectedOption }))
                    }
                    options={permissionOptions}
                  />
                </FormField>
              </ColumnLayout>
            ) : (
              <FormField
                label="Custom Group Name"
                description="Enter the full OSDU-compliant group name"
              >
                <Input
                  value={formData.customName}
                  onChange={({ detail }) => 
                    setFormData(prev => ({ ...prev, customName: detail.value }))
                  }
                  placeholder="service.storage.admin@osdu.dataservices.energy"
                />
              </FormField>
            )}

            <FormField
              label="Description"
              description="Optional description for the group"
            >
              <Textarea
                value={formData.description}
                onChange={({ detail }) => 
                  setFormData(prev => ({ ...prev, description: detail.value }))
                }
                placeholder="Describe the purpose of this group..."
                rows={3}
              />
            </FormField>

            {/* Group Name Preview */}
            <Container header={<Header variant="h4">Group Name Preview</Header>}>
              <SpaceBetween direction="vertical" size="s">
                <Box>
                  <strong>Generated Name:</strong>
                  <Box fontFamily="monospace" fontSize="body-s" margin={{ top: 'xs' }}>
                    {previewName || 'Enter required fields to see preview'}
                  </Box>
                </Box>
                
                {previewName && (
                  <Box>
                    <Badge color={nameValidation.valid ? 'green' : 'red'}>
                      {nameValidation.valid ? 'Valid' : 'Invalid'}
                    </Badge>
                    <Box margin={{ top: 'xs' }} color={nameValidation.valid ? 'text-status-success' : 'text-status-error'}>
                      {nameValidation.message}
                    </Box>
                  </Box>
                )}
              </SpaceBetween>
            </Container>

            <Box float="right">
              <Button
                variant="primary"
                onClick={handleCreateGroup}
                loading={loading}
                disabled={!previewName || !nameValidation.valid}
              >
                Create Group
              </Button>
            </Box>
          </SpaceBetween>
        </Container>

        {/* OSDU Naming Convention Help */}
        <Container header={<Header variant="h3">OSDU Naming Convention</Header>}>
          <SpaceBetween direction="vertical" size="s">
            <Box>
              <strong>Format:</strong> <code>{'{type}.{resource}.{permission}@{partition}.{domain}'}</code>
            </Box>
            
            <ColumnLayout columns={3}>
              <div>
                <Box variant="awsui-key-label">Group Types</Box>
                <ul>
                  <li><code>service</code> - Service access groups</li>
                  <li><code>data</code> - Data access groups</li>
                  <li><code>users</code> - User management groups</li>
                </ul>
              </div>
              
              <div>
                <Box variant="awsui-key-label">Permission Levels</Box>
                <ul>
                  <li><code>admin</code> - Full administrative access</li>
                  <li><code>user</code> - Standard user access</li>
                  <li><code>viewers</code> - Read-only access</li>
                  <li><code>editors</code> - Read and write access</li>
                  <li><code>owners</code> - Full ownership rights</li>
                </ul>
              </div>
              
              <div>
                <Box variant="awsui-key-label">Examples</Box>
                <ul>
                  <li><code>service.storage.admin@osdu.dataservices.energy</code></li>
                  <li><code>data.seismic.viewers@osdu.dataservices.energy</code></li>
                  <li><code>users.project.editors@osdu.dataservices.energy</code></li>
                </ul>
              </div>
            </ColumnLayout>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </Container>
  );
};

export default GroupCreation;