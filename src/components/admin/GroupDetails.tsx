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
  ColumnLayout
} from '@cloudscape-design/components';
import osduApi from '../../services/osduApiService';

interface Member {
  groupName: string;
  memberEmail: string;
  role: 'OWNER' | 'MEMBER';
  dataPartition: string;
  addedBy: string;
  addedAt: string;
}

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

interface GroupDetailsProps {
  group: Group;
  dataPartition?: string;
  onClose?: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ 
  group, 
  dataPartition = 'osdu',
  onClose 
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  
  // Add member modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    email: '',
    role: { label: 'Member', value: 'MEMBER' }
  });
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  const roleOptions = [
    { label: 'Member', value: 'MEMBER' },
    { label: 'Owner', value: 'OWNER' }
  ];

  useEffect(() => {
    if (group) {
      loadMembers();
    }
  }, [group]);

  const loadMembers = async () => {
    if (!group) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await osduApi.getGroupMembers(group.name, dataPartition);
      
      if (result && result.items) {
        setMembers(result.items);
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      console.error('Failed to load group members:', err);
      setError(err.message || 'Failed to load group members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberData.email.trim()) {
      setError('Member email is required');
      return;
    }

    setAddMemberLoading(true);
    setError(null);

    try {
      await osduApi.addMemberToGroup(
        group.name,
        newMemberData.email.trim(),
        newMemberData.role.value as 'OWNER' | 'MEMBER',
        dataPartition
      );

      setShowAddMemberModal(false);
      setNewMemberData({ email: '', role: { label: 'Member', value: 'MEMBER' } });
      await loadMembers();
      
    } catch (err: any) {
      console.error('Failed to add member:', err);
      setError(err.message || 'Failed to add member');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMembers = async () => {
    if (selectedMembers.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      for (const member of selectedMembers) {
        await osduApi.removeMemberFromGroup(
          group.name,
          member.memberEmail,
          dataPartition
        );
      }
      
      setSelectedMembers([]);
      await loadMembers();
      
    } catch (err: any) {
      console.error('Failed to remove members:', err);
      setError(err.message || 'Failed to remove members');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (member: Member, newRole: 'OWNER' | 'MEMBER') => {
    setLoading(true);
    setError(null);

    try {
      await osduApi.updateMemberRole(
        group.name,
        member.memberEmail,
        newRole,
        dataPartition
      );
      
      await loadMembers();
      
    } catch (err: any) {
      console.error('Failed to update member role:', err);
      setError(err.message || 'Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

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
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (member: Member) => (
        <SpaceBetween direction="horizontal" size="xs">
          {member.role === 'MEMBER' && (
            <Button
              size="small"
              onClick={() => handleUpdateMemberRole(member, 'OWNER')}
              disabled={loading}
            >
              Make Owner
            </Button>
          )}
          {member.role === 'OWNER' && members.filter(m => m.role === 'OWNER').length > 1 && (
            <Button
              size="small"
              onClick={() => handleUpdateMemberRole(member, 'MEMBER')}
              disabled={loading}
            >
              Make Member
            </Button>
          )}
        </SpaceBetween>
      )
    }
  ];

  if (!group) {
    return (
      <Container>
        <Alert type="warning">
          No group selected. Please select a group from the list.
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => setShowAddMemberModal(true)}
                variant="primary"
              >
                Add Member
              </Button>
              <Button
                onClick={handleRemoveMembers}
                disabled={selectedMembers.length === 0}
                loading={loading}
              >
                Remove Selected
              </Button>
              <Button
                onClick={loadMembers}
                loading={loading}
                iconName="refresh"
              >
                Refresh
              </Button>
              {onClose && (
                <Button onClick={onClose} iconName="close">
                  Close
                </Button>
              )}
            </SpaceBetween>
          }
        >
          Group Details
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Group Information */}
        <Container header={<Header variant="h3">Group Information</Header>}>
          <ColumnLayout columns={2} variant="text-grid">
            <div>
              <Box variant="awsui-key-label">Display Name</Box>
              <div>{group.displayName || group.name}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Full Name</Box>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                {group.name}
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Group Type</Box>
              <div>
                <Badge color="blue">{group.groupType?.toUpperCase()}</Badge>
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Service</Box>
              <div>{group.serviceName?.toUpperCase()}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Permission Level</Box>
              <div>
                <Badge color={group.permission === 'admin' ? 'red' : 'green'}>
                  {group.permission?.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <Box variant="awsui-key-label">Data Partition</Box>
              <div>{group.dataPartition}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Created By</Box>
              <div>{group.createdBy}</div>
            </div>
            <div>
              <Box variant="awsui-key-label">Created Date</Box>
              <div>{new Date(group.createdAt).toLocaleString()}</div>
            </div>
            {group.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Box variant="awsui-key-label">Description</Box>
                <div>{group.description}</div>
              </div>
            )}
          </ColumnLayout>
        </Container>

        {/* Group Members */}
        <Container
          header={
            <Header
              variant="h3"
              counter={`(${members.length})`}
            >
              Group Members
            </Header>
          }
        >
          <Table
            columnDefinitions={memberColumns}
            items={members}
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
            header={
              <Header
                counter={`(${members.length})`}
                description="Users who have access through this group"
              >
                Members
              </Header>
            }
          />
        </Container>

        {/* Add Member Modal */}
        <Modal
          visible={showAddMemberModal}
          onDismiss={() => setShowAddMemberModal(false)}
          header="Add Member to Group"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddMember}
                  loading={addMemberLoading}
                >
                  Add Member
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween direction="vertical" size="l">
            <Alert type="info">
              Adding a member to this group will grant them the group's permissions.
              Owners can manage group membership, while members only have the group's access rights.
            </Alert>
            
            <FormField
              label="Member Email"
              description="Email address of the user to add"
            >
              <Input
                value={newMemberData.email}
                onChange={({ detail }) => 
                  setNewMemberData(prev => ({ ...prev, email: detail.value }))
                }
                placeholder="user@example.com"
                type="email"
              />
            </FormField>
            
            <FormField
              label="Role"
              description="Role for the new member"
            >
              <Select
                selectedOption={newMemberData.role}
                onChange={({ detail }) => 
                  setNewMemberData(prev => ({ ...prev, role: detail.selectedOption }))
                }
                options={roleOptions}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </Container>
  );
};

export default GroupDetails;