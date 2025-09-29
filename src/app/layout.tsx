'use client';

import { Inter } from "next/font/google";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import themes from '../theme';

import ConfigureAmplify from '@/components/ConfigureAmplify';
import Providers from '@/components/Providers';
import ErrorBoundary from '@/components/ErrorBoundary';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserAttributes } from '@/components/UserAttributesProvider';

import IconButton from '@mui/material/IconButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Button from '@cloudscape-design/components/button';
import TopNavigation from "@cloudscape-design/components/top-navigation";
import Grid from '@cloudscape-design/components/grid';
import { applyMode, Mode } from '@cloudscape-design/global-styles';

import "./globals.css";
import "@aws-amplify/ui-react/styles.css";
import { FileSystemProvider } from "@/contexts/FileSystemContext";

import './app.scss';
import { type Schema } from "@/../amplify/data/resource";
import { generateClient } from 'aws-amplify/data';
import { sendMessage } from '@/../utils/amplifyUtils';
import { memoryManager } from '@/utils/memoryUtils';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [amplifyClient, setAmplifyClient] = useState<ReturnType<typeof generateClient<Schema>> | null>(null);
  const router = useRouter();
  
  // AWS Amplify Authentication
  const { signOut, authStatus } = useAuthenticator(context => [context.user, context.authStatus]);
  const { userAttributes } = useUserAttributes();

  // Initialize Amplify client after component mounts
  useEffect(() => {
    try {
      const client = generateClient<Schema>();
      setAmplifyClient(client);
    } catch (error) {
      console.error('Failed to generate Amplify client:', error);
    }
  }, []);

  const handleCreateNewChat = async () => {
    if (!amplifyClient) {
      console.error("Amplify client not initialized");
      alert("System not ready. Please try again in a moment.");
      return;
    }

    try {
      const newChatSession = await amplifyClient.models.ChatSession.create({});
      if (newChatSession.data?.id) {
        router.push(`/chat/${newChatSession.data.id}`);
      } else {
        throw new Error('Failed to create chat session - no ID returned');
      }
    } catch (error) {
      console.error("Error creating chat session:", error);
      alert("Failed to create chat session. Please try again.");
    }
  };

  const handleCreatePetrophysicsChat = async () => {
    if (!amplifyClient) {
      console.error("Amplify client not initialized");
      alert("System not ready. Please try again in a moment.");
      return;
    }

    try {
      const newChatSession = await amplifyClient.models.ChatSession.create({});
      
      if (newChatSession.data && newChatSession.data.id) {
        // Send an initial message with petrophysics keywords to trigger the petrophysics system message
        const initialMessage: Schema['ChatMessage']['createType'] = {
          role: 'human',
          content: {
            text: "I need help with petrophysical analysis. Please show me the available tools and capabilities."
          },
          chatSessionId: newChatSession.data.id,
        } as any;
        
        // Send the initial message
        await sendMessage({
          chatSessionId: newChatSession.data.id,
          newMessage: initialMessage,
        });
        
        // Navigate to the new chat session
        router.push(`/chat/${newChatSession.data.id}`);
      }
    } catch (error) {
      console.error("Error creating petrophysics chat session:", error);
      alert("Failed to create petrophysics chat session.");
    }
  };
  
  useEffect(() => {
    // Apply the mode when component mounts and when darkMode changes
    applyMode(darkMode ? Mode.Dark : Mode.Light);
    
    // Try to load the preference from localStorage if available
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        setDarkMode(savedMode === 'true');
      }
    }
  }, [darkMode]);

  // Memory monitoring setup
  useEffect(() => {
    // Start memory monitoring when app loads
    const stopMonitoring = memoryManager.startMemoryMonitoring(30000);
    
    // Cleanup function
    return () => {
      stopMonitoring();
    };
  }, []);
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Save preference to localStorage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(newMode));
    }
  };
  
  // Return ONLY the content without html/body tags
  return (
    <ThemeProvider theme={darkMode ? themes.dark : themes.light}>
      <CssBaseline />
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
              items: [
                {
                  id: 'catalog-main',
                  text: 'View All Data',
                  href: '/catalog',
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
              items: [
                {
                  id: 'list',
                  text: 'View All Canvases',
                  href: '/listChats',
                },
                {
                  id: 'ws',
                  text: 'Canvases',
                  items: [
                    {
                  id: 'ws1',
                  text: 'Petrophysical Analysis',
                  href: '/create-new-chat',
                    },
                  ],
                },
                {
                  id: 'ws-new',
                  text: 'Create New Canvas',
                  iconName: 'add-plus',
                  href: '/create-new-chat',
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
                  href: '',
                },
                {
                  id: 'status',
                  text: 'Platform Configurations',
                  href: '',
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
            authStatus === 'authenticated' ? {
              type: 'menu-dropdown',
              text: userAttributes?.given_name || userAttributes?.name || 'User',
              description: userAttributes?.email || 'user@example.com',
              iconName: 'user-profile',
              onItemClick: ({ detail }) => {
                if (detail.id === 'signout') {
                  signOut();
                }
              },
              items: [
                {
                  id: 'support-group',
                  text: 'Support',
                  items: [
                    {
                      id: 'documentation-support',
                      text: 'Documentation',
                      href: '#',
                      external: true,
                      externalIconAriaLabel: ' (opens in new tab)',
                    },
                    {
                      id: 'support-support',
                      text: 'Support',
                      href: '#',
                      external: true,
                      externalIconAriaLabel: ' (opens in new tab)',
                    },
                    {
                      id: 'feedback-support',
                      text: 'Feedback',
                      href: '#',
                      external: true,
                      externalIconAriaLabel: ' (opens in new tab)',
                    },
                  ],
                },
                {
                  id: 'signout',
                  text: 'Sign out',
                },
              ],
            } : {
              type: 'button',
              text: 'Sign in',
              href: '/auth',
              variant: 'primary-button',
              iconName: 'user-profile',
            },
          ]}
        />
        <div style={{
          flexGrow: 1,
          overflow: 'auto'
        }}>
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AppRouterCacheProvider>
          <ConfigureAmplify />
          <ErrorBoundary>
            <FileSystemProvider>
              <Providers>
                <RootLayoutContent>
                  {children}
                </RootLayoutContent>
              </Providers>
            </FileSystemProvider>
          </ErrorBoundary>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
