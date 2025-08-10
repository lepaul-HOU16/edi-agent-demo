'use client';

import React, { useState } from 'react';
import {
  AppLayout,
  SideNavigation,
  Header,
  SpaceBetween,
  Alert
} from '@cloudscape-design/components';
import AdminBootstrap from '../../components/admin/AdminBootstrap';
import GroupManagement from '../../components/admin/GroupManagement';
import { useAuth } from '../../contexts/OidcAuthContext';

const AdminPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeItem, setActiveItem] = useState('bootstrap');
  const [navigationOpen, setNavigationOpen] = useState(false);

  const navigationItems = [
    {
      type: 'section',
      text: 'Admin Tools',
      items: [
        {
          type: 'link',
          text: 'Bootstrap Admin',
          href: '#bootstrap',
          info: 'Set up initial admin access'
        },
        {
          type: 'link', 
          text: 'Group Management',
          href: '#groups',
          info: 'Manage OSDU groups and members'
        }
      ]
    }
  ];

  const handleNavigationChange = ({ detail }: any) => {
    const href = detail.href;
    if (href === '#bootstrap') {
      setActiveItem('bootstrap');
    } else if (href === '#groups') {
      setActiveItem('groups');
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'bootstrap':
        return <AdminBootstrap />;
      case 'groups':
        return <GroupManagement />;
      default:
        return <AdminBootstrap />;
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout
        navigationHide
        content={
          <SpaceBetween direction="vertical" size="l">
            <Header variant="h1">OSDU Admin Panel</Header>
            <Alert type="warning" header="Authentication Required">
              Please log in to access the admin panel. Admin access requires proper OSDU credentials.
            </Alert>
          </SpaceBetween>
        }
      />
    );
  }

  return (
    <AppLayout
      navigation={
        <SideNavigation
          header={{
            href: '#',
            text: 'OSDU Admin'
          }}
          items={navigationItems}
          activeHref={`#${activeItem}`}
          onFollow={handleNavigationChange}
        />
      }
      navigationOpen={navigationOpen}
      onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      content={
        <SpaceBetween direction="vertical" size="l">
          <Header 
            variant="h1"
            description={`Logged in as: ${user?.email || 'Unknown user'}`}
          >
            OSDU Admin Panel
          </Header>
          
          <Alert type="info" header="Admin Panel">
            <SpaceBetween direction="vertical" size="xs">
              <div>
                Welcome to the OSDU Admin Panel. This interface provides tools for managing 
                OSDU groups, permissions, and administrative functions.
              </div>
              <div>
                <strong>Current User:</strong> {user?.email || 'Unknown'}
              </div>
              <div>
                <strong>Data Partition:</strong> osdu
              </div>
            </SpaceBetween>
          </Alert>

          {renderContent()}
        </SpaceBetween>
      }
    />
  );
};

export default AdminPage;