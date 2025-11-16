import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { applyMode, Mode } from '@cloudscape-design/global-styles';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Load saved mode on mount
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        setDarkMode(savedMode === 'true');
      }
    }
  }, []);

  useEffect(() => {
    // Apply mode changes
    applyMode(darkMode ? Mode.Dark : Mode.Light);
    if (typeof window !== 'undefined') {
      document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      document.body.setAttribute('data-awsui-mode', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(newMode));
      window.dispatchEvent(new Event('themechange'));
    }
  };

  const handleCreateNewChat = () => {
    navigate('/create-new-chat');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <TopNavigation
        identity={{
          href: '/',
          title: 'Energy Data Insights',
          logo: {
            src: 'https://main.doc6ahlxcozk0.amplifyapp.com/_next/static/media/a4e-logo.61cbe3b3.png',
            alt: 'EDI',
          },
        }}
        utilities={[
          {
            type: 'menu-dropdown',
            text: 'Data Catalog',
            iconName: 'map',
            onItemClick: ({ detail }) => {
              if (detail.id === 'catalog-main') navigate('/catalog');
              if (detail.id === 'view-collections') navigate('/collections');
            },
            items: [
              {
                id: 'catalog-main',
                text: 'View All Data',
              },
              {
                id: 'view-collections',
                text: 'View All Collections',
                iconName: 'folder',
              },
              {
                id: 'dc',
                text: 'Data Collections',
                items: [
                  {
                    id: 'dc1',
                    text: 'Cuu Long Basin',
                  },
                  {
                    id: 'dc2',
                    text: 'Nam Con Son Basin',
                  },
                ],
              },
            ],
          },
          {
            type: 'menu-dropdown',
            text: 'Workspace',
            iconName: 'gen-ai',
            onItemClick: ({ detail }) => {
              if (detail.id === 'view-all-canvases') navigate('/canvases');
              if (detail.id === 'list') navigate('/listChats');
              if (detail.id === 'ws1') navigate('/create-new-chat');
              if (detail.id === 'ws-new') navigate('/create-new-chat');
            },
            items: [
              {
                id: 'view-all-canvases',
                text: 'View All Canvases',
                iconName: 'view-full',
              },
              {
                id: 'list',
                text: 'List Chats (Deprecated)',
              },
              {
                id: 'ws',
                text: 'Canvases',
                items: [
                  {
                    id: 'ws1',
                    text: 'Petrophysical Analysis',
                  },
                ],
              },
              {
                id: 'ws-new',
                text: 'Create New Canvas',
                iconName: 'add-plus',
              },
            ],
          },
          {
            type: 'menu-dropdown',
            iconName: 'grid-view',
            text: 'Tools',
            ariaLabel: 'Tools',
            title: 'Tools',
            items: [
              {
                id: 'team',
                text: 'Team Administration',
              },
              {
                id: 'status',
                text: 'Platform Configurations',
              },
            ],
          },
          {
            type: 'button',
            iconSvg: darkMode ? 
              <LightModeIcon sx={{ fontSize: '16px', color: 'currentColor' }} /> : 
              <DarkModeIcon sx={{ fontSize: '16px', color: 'currentColor' }} />,
            ariaLabel: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
            title: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
            onClick: toggleDarkMode,
          },

        ]}
      />
      <div style={{
        flexGrow: 1,
        overflow: 'auto',
        padding: '40px',
      }}>
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
