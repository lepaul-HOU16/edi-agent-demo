import React, { useState, useEffect } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Alert,
  Table,
  Button,
  Badge,
  Modal,
  FormField,
  Input,
  Select,
  TextFilter,
  Tabs,
  ColumnLayout
} from '@cloudscape-design/components';
import osduApi from '../../services/osduApiService';

/**
 * Transform and validate user groups data from API response
 * Adds defensive checks for missing or null field values
 */
function transformUserGroupsData(apiResponse: any): UserGroupMembership[] {
  if (!apiResponse || !apiResponse.items || !Array.isArray(apiResponse.items)) {
    console.warn('Invalid API response structure for user groups:', apiResponse);
    return [];
  }

  return apiResponse.items.map((item: any, index: number) => {
    // Defensive checks for required fields
    const transformedItem: UserGroupMembership = {
      name: item.name || `Unknown Group ${index + 1}`,
      description: item.description || '',
      dataPartition: item.dataPartition || 'osdu',
      createdBy: item.createdBy || 'unknown',
      createdAt: item.createdAt || '',
      updatedBy: item.updatedBy || '',
      updatedAt: item.updatedAt || '',
      memberRole: item.memberRole || 'MEMBER',
      memberSince: item.memberSince || item.addedAt || '',
      addedBy: item.addedBy || 'unknown'
    };

    // Log any missing critical fields for debugging
    if (!item.name) {
      console.warn('Missing group name in API response item:', item);
    }
    if (!item.memberRole) {
      console.warn('Missing memberRole in API response item:', item);
    }
    if (!item.memberSince && !item.addedAt) {
      console.warn('Missing memberSince and addedAt in API response item:', item);
    }

    return transformedItem;
  });
}

interface Member {
  groupName: string;
  memberEmail: string;
  role: 'OWNER' | 'MEMBER';
  dataPartition: string;
  addedBy: string;
  addedAt: string;
}

interface UserGroupMembership {
  name: string;                    // Group name
  description?: string;            // Group description
  dataPartition: string;          // Data partition
  createdBy?: string;             // Group creator
  createdAt?: string;             // Group creation date
  updatedBy?: string;             // Group last updater
  updatedAt?: string;             // Group last update date
  memberRole: 'OWNER' | 'MEMBER'; // User's role in this group
  memberSince: string;            // When user was added to group (ISO date string)
  addedBy: string;                // Who added the user to the group
}

interface Group {
  name: string;
  description: string;
  dataPartition: string;
  displayName?: string;
  groupType?: string;
  serviceName?: string;
  permission?: string;
}

interface MemberManagementProps {
  dataPartition?: string;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ 
  dataPartition = 'osdu'
}) => {
  const [activeTab, setActiveTab] = useState('by-group');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Group-based view
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  
  // User-based view
  const [userEmail, setUserEmail] = useState('');
  const [userGroups, setUserGroups] = useState<UserGroupMembership[]>([]);
  
  // Filtering
  const [filterText, setFilterText] = useState('');
  
  // Bulk operations modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'add' | 'remove' | 'role'>('add');
  const [bulkData, setBulkData] = useState({
    emails: '',
    targetGroup: null as Group | null,
    newRole: { label: 'Member', value: 'MEMBER' }
  });
  const [bulkLoading, setBulkLoading] = useState(false);

  const roleOptions = [
    { label: 'Member', value: 'MEMBER' },
    { label: 'Owner', value: 'OWNER' }
  ];

  useEffect(() => {
    loadGroups();
  }, [dataPartition]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await osduApi.listGroups(dataPartition);
      
      if (result && result.items) {
        const transformedGroups = result.items.map(group => 
          osduApi.transformGroupData(group)
        );
        setGroups(transformedGroups);
        
        if (!selectedGroup && transformedGroups.length > 0) {
          setSelectedGroup(transformedGroups[0]);
        }
      } else {
        setGroups([]);
      }
    } catch (err: any) {
      console.error('Failed to load groups:', err);
      setError(err.message || 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (group: Group) => {
    if (!group) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await osduApi.getGroupMembers(group.name, dataPartition);
      
      if (result && result.items) {
        setGroupMembers(result.items);
      } else {
        setGroupMembers([]);
      }
    } catch (err: any) {
      console.error('Failed to load group members:', err);
      setError(err.message || 'Failed to load group members');
      setGroupMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserGroups = async (email: string) => {
    if (!email.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await osduApi.getUserGroups(email.trim(), dataPartition);
      
      // Transform and validate the API response data
      const transformedGroups = transformUserGroupsData(result);
      setUserGroups(transformedGroups);
      
      console.log('User groups loaded successfully:', {
        originalCount: result?.items?.length || 0,
        transformedCount: transformedGroups.length,
        totalCount: result?.pagination?.totalCount || 0
      });
    } catch (err: any) {
      console.error('Failed to load user groups:', err);
      setError(err.message || 'Failed to load user groups');
      setUserGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async () => {
    if (!bulkData.emails.trim()) {
      setError('Email addresses are required');
      return;
    }

    setBulkLoading(true);
    setError(null);

    try {
      const emails = bulkData.emails
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);

      if (bulkOperation === 'add' && bulkData.targetGroup) {
        for (const email of emails) {
          await osduApi.addMemberToGroup(
            bulkData.targetGroup.name,
            email,
            bulkData.newRole.value as 'OWNER' | 'MEMBER',
            dataPartition
          );
        }
      } else if (bulkOperation === 'remove') {
        for (const member of selectedMembers) {
          await osduApi.removeMemberFromGroup(
            member.groupName,
            member.memberEmail,
            dataPartition
          );
        }
      } else if (bulkOperation === 'role') {
        for (const member of selectedMembers) {
          await osduApi.updateMemberRole(
            member.groupName,
            member.memberEmail,
            bulkData.newRole.value as 'OWNER' | 'MEMBER',
            dataPartition
          );
        }
      }

      setShowBulkModal(false);
      setBulkData({ emails: '', targetGroup: null, newRole: { label: 'Member', value: 'MEMBER' } });
      setSelectedMembers([]);
      
      if (selectedGroup) {
        await loadGroupMembers(selectedGroup);
      }
      
    } catch (err: any) {
      console.error('Bulk operation failed:', err);
      setError(err.message || 'Bulk operation failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredGroupMembers = groupMembers.filter(member =>
    !filterText || 
    member.memberEmail.toLowerCase().includes(filterText.toLowerCase()) ||
    member.groupName.toLowerCase().includes(filterText.toLowerCase())
  );

  const filteredUserGroups = userGroups.filter(membership =>
    !filterText || 
    membership.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const memberColumns = [
    {
      id: 'memberEmail',
      header: 'Member Email',
      cell: (member: Member) => member.memberEmail,
      sortingField: 'memberEmail'
    },
    {
      id: 'role',
      header: 'Role',
      cell: (member: Member) => (
        <Badge color={member.role === 'OWNER' ? 'blue' : 'grey'}>
          {member.role}
        </Badge>
      ),
      sortingField: 'role'
    },
    {
      id: 'addedBy',
      header: 'Added By',
      cell: (member: Member) => member.addedBy,
      sortingField: 'addedBy'
    },
    {
      id: 'addedAt',
      header: 'Added Date',
      cell: (member: Member) => new Date(member.addedAt).toLocaleDateString(),
      sortingField: 'addedAt'
    }
  ];

  const userGroupColumns = [
    {
      id: 'groupName',
      header: 'Group Name',
      cell: (membership: UserGroupMembership) => {
        const group = groups.find(g => g.name === membership.name);
        return (
          <Box>
            <strong>{group?.displayName || membership.name || 'Unknown Group'}</strong>
            <br />
            <small style={{ color: '#666' }}>{membership.name || 'N/A'}</small>
          </Box>
        );
      },
      sortingField: 'name'
    },
    {
      id: 'role',
      header: 'Role',
      cell: (membership: UserGroupMembership) => (
        <Badge color={membership.memberRole === 'OWNER' ? 'blue' : 'grey'}>
          {membership.memberRole || 'MEMBER'}
        </Badge>
      ),
      sortingField: 'memberRole'
    },
    {
      id: 'addedBy',
      header: 'Added By',
      cell: (membership: UserGroupMembership) => membership.addedBy || 'Unknown',
      sortingField: 'addedBy'
    },
    {
      id: 'addedAt',
      header: 'Added Date',
      cell: (membership: UserGroupMembership) => {
        try {
          if (!membership.memberSince) {
            return 'Date not available';
          }
          const date = new Date(membership.memberSince);
          if (isNaN(date.getTime())) {
            return 'Invalid date';
          }
          return date.toLocaleDateString();
        } catch (error) {
          console.warn('Date formatting error:', error, membership.memberSince);
          return 'Date format error';
        }
      },
      sortingField: 'memberSince'
    }
  ];

  const groupOptions = groups.map(group => ({
    label: group.displayName || group.name,
    value: group.name,
    group: group
  }));

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setBulkOperation('add');
                  setShowBulkModal(true);
                }}
                variant="primary"
              >
                Bulk Add Members
              </Button>
              <Button
                onClick={() => {
                  setBulkOperation('remove');
                  setShowBulkModal(true);
                }}
                disabled={selectedMembers.length === 0}
              >
                Bulk Remove
              </Button>
              <Button
                onClick={() => {
                  setBulkOperation('role');
                  setShowBulkModal(true);
                }}
                disabled={selectedMembers.length === 0}
              >
                Bulk Update Roles
              </Button>
            </SpaceBetween>
          }
        >
          Member Management
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'by-group',
              label: 'Members by Group',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <ColumnLayout columns={2}>
                    <FormField label="Select Group">
                      <Select
                        selectedOption={selectedGroup ? {
                          label: selectedGroup.displayName || selectedGroup.name,
                          value: selectedGroup.name
                        } : null}
                        onChange={({ detail }) => {
                          const group = groups.find(g => g.name === detail.selectedOption.value);
                          setSelectedGroup(group || null);
                        }}
                        options={groupOptions}
                        placeholder="Choose a group"
                      />
                    </FormField>
                    <FormField label="Filter Members">
                      <TextFilter
                        filteringText={filterText}
                        filteringPlaceholder="Search members..."
                        onChange={({ detail }) => setFilterText(detail.filteringText)}
                      />
                    </FormField>
                  </ColumnLayout>

                  {selectedGroup && (
                    <Container
                      header={
                        <Header variant="h3">
                          {selectedGroup.displayName} Members ({filteredGroupMembers.length})
                        </Header>
                      }
                    >
                      <Table
                        columnDefinitions={memberColumns}
                        items={filteredGroupMembers}
                        loading={loading}
                        loadingText="Loading members..."
                        selectionType="multi"
                        selectedItems={selectedMembers}
                        onSelectionChange={({ detail }) => setSelectedMembers(detail.selectedItems)}
                        empty={
                          <Box textAlign="center" color="inherit">
                            <b>No members found</b>
                            <Box variant="p" color="inherit">
                              This group has no members yet.
                            </Box>
                          </Box>
                        }
                      />
                    </Container>
                  )}
                </SpaceBetween>
              )
            },
            {
              id: 'by-user',
              label: 'Groups by User',
              content: (
                <SpaceBetween direction="vertical" size="l">
                  <ColumnLayout columns={2}>
                    <FormField label="User Email">
                      <Input
                        value={userEmail}
                        onChange={({ detail }) => setUserEmail(detail.value)}
                        placeholder="user@example.com"
                        type="email"
                      />
                    </FormField>
                    <FormField label="Filter Groups">
                      <TextFilter
                        filteringText={filterText}
                        filteringPlaceholder="Search groups..."
                        onChange={({ detail }) => setFilterText(detail.filteringText)}
                      />
                    </FormField>
                  </ColumnLayout>

                  <Button
                    onClick={() => loadUserGroups(userEmail)}
                    variant="primary"
                    disabled={!userEmail.trim()}
                    loading={loading}
                  >
                    Load User Groups
                  </Button>

                  {userGroups.length > 0 && (
                    <Container
                      header={
                        <Header variant="h3">
                          Groups for {userEmail} ({filteredUserGroups.length})
                        </Header>
                      }
                    >
                      <Table
                        columnDefinitions={userGroupColumns}
                        items={filteredUserGroups}
                        loading={loading}
                        loadingText="Loading user groups..."
                        empty={
                          <Box textAlign="center" color="inherit">
                            <b>No groups found</b>
                            <Box variant="p" color="inherit">
                              This user is not a member of any groups.
                            </Box>
                          </Box>
                        }
                      />
                    </Container>
                  )}
                </SpaceBetween>
              )
            }
          ]}
        />

        {/* Bulk Operations Modal */}
        <Modal
          visible={showBulkModal}
          onDismiss={() => setShowBulkModal(false)}
          header={`Bulk ${bulkOperation === 'add' ? 'Add Members' : bulkOperation === 'remove' ? 'Remove Members' : 'Update Roles'}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => setShowBulkModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkOperation}
                  loading={bulkLoading}
                >
                  {bulkOperation === 'add' ? 'Add Members' : bulkOperation === 'remove' ? 'Remove Members' : 'Update Roles'}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            {bulkOperation === 'add' && (
              <>
                <Alert type="info">
                  Add multiple users to a group at once. Enter email addresses separated by commas or new lines.
                </Alert>
                
                <FormField label="Target Group">
                  <Select
                    selectedOption={bulkData.targetGroup ? {
                      label: bulkData.targetGroup.displayName || bulkData.targetGroup.name,
                      value: bulkData.targetGroup.name
                    } : null}
                    onChange={({ detail }) => {
                      const group = groups.find(g => g.name === detail.selectedOption.value);
                      setBulkData(prev => ({ ...prev, targetGroup: group || null }));
                    }}
                    options={groupOptions}
                    placeholder="Choose target group"
                  />
                </FormField>
                
                <FormField label="Email Addresses">
                  <Input
                    value={bulkData.emails}
                    onChange={({ detail }) => 
                      setBulkData(prev => ({ ...prev, emails: detail.value }))
                    }
                    placeholder="user1@example.com, user2@example.com"
                  />
                </FormField>
                
                <FormField label="Role">
                  <Select
                    selectedOption={bulkData.newRole}
                    onChange={({ detail }) => 
                      setBulkData(prev => ({ ...prev, newRole: detail.selectedOption }))
                    }
                    options={roleOptions}
                  />
                </FormField>
              </>
            )}

            {bulkOperation === 'remove' && (
              <>
                <Alert type="warning">
                  Remove {selectedMembers.length} selected members from their groups.
                  This action cannot be undone.
                </Alert>
                
                <Box>
                  <strong>Members to remove:</strong>
                  <ul>
                    {selectedMembers.map((member, index) => (
                      <li key={index}>
                        {member.memberEmail} from {member.groupName}
                      </li>
                    ))}
                  </ul>
                </Box>
              </>
            )}

            {bulkOperation === 'role' && (
              <>
                <Alert type="info">
                  Update the role for {selectedMembers.length} selected members.
                </Alert>
                
                <FormField label="New Role">
                  <Select
                    selectedOption={bulkData.newRole}
                    onChange={({ detail }) => 
                      setBulkData(prev => ({ ...prev, newRole: detail.selectedOption }))
                    }
                    options={roleOptions}
                  />
                </FormField>
                
                <Box>
                  <strong>Members to update:</strong>
                  <ul>
                    {selectedMembers.map((member, index) => (
                      <li key={index}>
                        {member.memberEmail} in {member.groupName} (currently {member.role})
                      </li>
                    ))}
                  </ul>
                </Box>
              </>
            )}
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default MemberManagement;