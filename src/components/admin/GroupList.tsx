import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  Table,
  Button,
  SpaceBetween,
  Box,
  Alert,
  Pagination,
  TextFilter,
  Select,
  Modal,
  FormField,
  Input,
  Textarea
} from '@cloudscape-design/components';
import osduApi from '../../services/osduApiService';

interface Group {
  name: string;
  description: string;
  dataPartition: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  displayName?: string;
  groupType?: string;
  serviceName?: string;
  permission?: string;
}

interface GroupListProps {
  dataPartition?: string;
  onGroupSelect?: (group: Group) => void;
}

const GroupList: React.FC<GroupListProps> = ({ 
  dataPartition = 'osdu',
  onGroupSelect 
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  
  // Pagination
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pagesCount, setPagesCount] = useState(1);
  const itemsPerPage = 10;
  
  // Filtering
  const [filterText, setFilterText] = useState('');
  const [groupTypeFilter, setGroupTypeFilter] = useState({ label: 'All Types', value: 'all' });
  
  // Create group modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createGroupData, setCreateGroupData] = useState({
    name: '',
    description: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  const groupTypeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Service Groups', value: 'service' },
    { label: 'Data Groups', value: 'data' },
    { label: 'User Groups', value: 'users' }
  ];

  useEffect(() => {
    loadGroups();
  }, [dataPartition]);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await osduApi.listGroups(dataPartition);
      
      if (result && result.items) {
        // Transform group data for display
        const transformedGroups = result.items.map(group => 
          osduApi.transformGroupData(group)
        );
        setGroups(transformedGroups);
        setPagesCount(Math.ceil(transformedGroups.length / itemsPerPage));
      } else {
        setGroups([]);
        setPagesCount(1);
      }
    } catch (err: any) {
      console.error('Failed to load groups:', err);
      setError(err.message || 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createGroupData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setCreateLoading(true);
    setError(null);

    try {
      // Validate group name format
      osduApi.validateGroupName(createGroupData.name);
      
      await osduApi.createGroup({
        name: createGroupData.name.trim(),
        description: createGroupData.description.trim()
      }, dataPartition);

      setShowCreateModal(false);
      setCreateGroupData({ name: '', description: '' });
      await loadGroups();
      
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setError(err.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteGroups = async () => {
    if (selectedGroups.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      for (const group of selectedGroups) {
        await osduApi.deleteGroup(group.name, dataPartition);
      }
      
      setSelectedGroups([]);
      await loadGroups();
      
    } catch (err: any) {
      console.error('Failed to delete groups:', err);
      setError(err.message || 'Failed to delete groups');
    } finally {
      setLoading(false);
    }
  };

  // Filter groups based on search text and type
  const filteredGroups = groups.filter(group => {
    const matchesText = !filterText || 
      group.name.toLowerCase().includes(filterText.toLowerCase()) ||
      group.description?.toLowerCase().includes(filterText.toLowerCase()) ||
      group.displayName?.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesType = groupTypeFilter.value === 'all' || 
      group.groupType === groupTypeFilter.value;
    
    return matchesText && matchesType;
  });

  // Paginate filtered results
  const startIndex = (currentPageIndex - 1) * itemsPerPage;
  const paginatedGroups = filteredGroups.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

  const tableColumns = [
    {
      id: 'displayName',
      header: 'Group Name',
      cell: (group: Group) => (
        <Box>
          <strong>{group.displayName}</strong>
          <br />
          <small style={{ color: '#666' }}>{group.name}</small>
        </Box>
      ),
      sortingField: 'displayName'
    },
    {
      id: 'groupType',
      header: 'Type',
      cell: (group: Group) => (
        <Box>
          {group.groupType?.toUpperCase()}
        </Box>
      ),
      sortingField: 'groupType'
    },
    {
      id: 'serviceName',
      header: 'Service',
      cell: (group: Group) => (
        <Box>
          {group.serviceName?.toUpperCase()}
        </Box>
      ),
      sortingField: 'serviceName'
    },
    {
      id: 'permission',
      header: 'Permission',
      cell: (group: Group) => (
        <Box>
          {group.permission?.toUpperCase()}
        </Box>
      ),
      sortingField: 'permission'
    },
    {
      id: 'description',
      header: 'Description',
      cell: (group: Group) => group.description || 'No description',
      sortingField: 'description'
    },
    {
      id: 'createdBy',
      header: 'Created By',
      cell: (group: Group) => group.createdBy,
      sortingField: 'createdBy'
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (group: Group) => new Date(group.createdAt).toLocaleDateString(),
      sortingField: 'createdAt'
    }
  ];

  return (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${filteredGroups.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
              >
                Create Group
              </Button>
              <Button
                onClick={handleDeleteGroups}
                disabled={selectedGroups.length === 0}
                loading={loading}
              >
                Delete Selected
              </Button>
              <Button
                onClick={loadGroups}
                loading={loading}
                iconName="refresh"
              >
                Refresh
              </Button>
            </SpaceBetween>
          }
        >
          OSDU Groups
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <SpaceBetween direction="horizontal" size="l">
          <TextFilter
            filteringText={filterText}
            filteringPlaceholder="Search groups..."
            filteringAriaLabel="Filter groups"
            onChange={({ detail }) => setFilterText(detail.filteringText)}
          />
          <Select
            selectedOption={groupTypeFilter}
            onChange={({ detail }) => setGroupTypeFilter(detail.selectedOption)}
            options={groupTypeOptions}
            placeholder="Filter by type"
          />
        </SpaceBetween>

        <Table
          columnDefinitions={tableColumns}
          items={paginatedGroups}
          loading={loading}
          loadingText="Loading groups..."
          selectionType="multi"
          selectedItems={selectedGroups}
          onSelectionChange={({ detail }) => setSelectedGroups(detail.selectedItems)}
          onRowClick={({ detail }) => onGroupSelect?.(detail.item)}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No groups found</b>
              <Box variant="p" color="inherit">
                {filteredGroups.length === 0 && groups.length > 0
                  ? 'No groups match the current filter.'
                  : 'No groups have been created yet.'}
              </Box>
            </Box>
          }
          header={
            <Header
              counter={`(${filteredGroups.length} of ${groups.length})`}
            >
              Groups
            </Header>
          }
          pagination={
            totalPages > 1 ? (
              <Pagination
                currentPageIndex={currentPageIndex}
                pagesCount={totalPages}
                onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
              />
            ) : undefined
          }
        />

        {/* Create Group Modal */}
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          header="Create New Group"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateGroup}
                  loading={createLoading}
                >
                  Create Group
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            <Alert type="info">
              Group names must follow OSDU convention:<br/>
              <code>{'{type}.{service}.{permission}@{partition}.{domain}'}</code><br/>
              Example: <code>service.storage.admin@osdu.dataservices.energy</code>
            </Alert>
            
            <FormField
              label="Group Name"
              description="Full OSDU-compliant group name"
            >
              <Input
                value={createGroupData.name}
                onChange={({ detail }) => 
                  setCreateGroupData(prev => ({ ...prev, name: detail.value }))
                }
                placeholder="service.storage.admin@osdu.dataservices.energy"
              />
            </FormField>
            
            <FormField
              label="Description"
              description="Optional description for the group"
            >
              <Textarea
                value={createGroupData.description}
                onChange={({ detail }) => 
                  setCreateGroupData(prev => ({ ...prev, description: detail.value }))
                }
                placeholder="Describe the purpose of this group..."
                rows={3}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default GroupList;