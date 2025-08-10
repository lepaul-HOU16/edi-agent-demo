import React, { useState } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Tabs,
  Alert
} from '@cloudscape-design/components';
import GroupList from './GroupList';
import GroupDetails from './GroupDetails';
import MemberManagement from './MemberManagement';
import GroupCreation from './GroupCreation';

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

interface GroupManagementProps {
  dataPartition?: string;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ 
  dataPartition = 'osdu'
}) => {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setActiveTab('details');
  };

  const handleGroupCreated = (group: any) => {
    // Trigger refresh of group list
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
  };

  const handleCloseDetails = () => {
    setSelectedGroup(null);
    setActiveTab('list');
  };

  return (
    <Container
      header={
        <Header variant="h1">
          OSDU Group Management
        </Header>
      }
    >
      <SpaceBetween direction="vertical" size="l">
        <Alert type="info" header="OSDU Group-Based Permissions">
          <SpaceBetween direction="vertical" size="xs">
            <div>
              This interface manages OSDU-compliant groups that follow the official OSDU entitlements specification.
              Groups use the naming convention: <code>{'{type}.{resource}.{permission}@{partition}.{domain}'}</code>
            </div>
            <div>
              <strong>Current Data Partition:</strong> {dataPartition}
            </div>
          </SpaceBetween>
        </Alert>

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
          tabs={[
            {
              id: 'list',
              label: 'Group List',
              content: (
                <GroupList
                  dataPartition={dataPartition}
                  onGroupSelect={handleGroupSelect}
                  key={refreshTrigger} // Force refresh when groups are created
                />
              )
            },
            {
              id: 'details',
              label: 'Group Details',
              disabled: !selectedGroup,
              content: selectedGroup ? (
                <GroupDetails
                  group={selectedGroup}
                  dataPartition={dataPartition}
                  onClose={handleCloseDetails}
                />
              ) : (
                <Alert type="info">
                  Select a group from the Group List to view its details and manage members.
                </Alert>
              )
            },
            {
              id: 'members',
              label: 'Member Management',
              content: (
                <MemberManagement
                  dataPartition={dataPartition}
                />
              )
            },
            {
              id: 'create',
              label: 'Create Group',
              content: (
                <GroupCreation
                  dataPartition={dataPartition}
                  onGroupCreated={handleGroupCreated}
                />
              )
            }
          ]}
        />
      </SpaceBetween>
    </Container>
  );
};

export default GroupManagement;