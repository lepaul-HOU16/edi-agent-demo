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
// import TopNavBar from '@/components/TopNavBar';

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
import { generateClient } from 'aws-amplify/api';
import { sendMessage } from '@/../utils/amplifyUtils';

const amplifyClient = generateClient<Schema>();
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
// Remove useRouter from the top-level scope

// Removed export of metadata from client component

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const router = useRouter();

  const handleCreateNewChat = async () => {
    try {
      // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
      amplifyClient.queries.invokeReActAgent({ chatSessionId: "initilize" })

      const newChatSession = await amplifyClient.models.ChatSession.create({});
      router.push(`/chat/${newChatSession.data!.id}`);
    } catch (error) {
      console.error("Error creating chat session:", error);
      alert("Failed to create chat session.");
    }
  };

  const handleCreatePetrophysicsChat = async () => {
    try {
      // Invoke the lambda function so that MCP servers initialize before the user is waiting for a response
      amplifyClient.queries.invokeReActAgent({ chatSessionId: "initilize" })

      const newChatSession = await amplifyClient.models.ChatSession.create({});
      
      if (newChatSession.data && newChatSession.data.id) {
        // Send an initial message with petrophysics keywords to trigger the petrophysics system message
        const initialMessage: Schema['ChatMessage']['createType'] = {
          role: 'human',
          content: {
            text: "I need help with petrophysical analysis. Please show me the available tools and capabilities."
          },
          chatSessionId: newChatSession.data.id,
        };
        
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
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Save preference to localStorage if available
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(newMode));
    }
  };
  
  return (
    <html lang="en" data-mode={darkMode ? 'dark' : 'light'}>
      <body
        className={`${inter.variable} antialiased`}
      >
        <AppRouterCacheProvider>
          <ConfigureAmplify />
          <FileSystemProvider>
            <Providers>
              <ThemeProvider theme={darkMode ? themes.dark : themes.light}>
                <CssBaseline />
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                  overflow: 'hidden'
                }}>
                  {/* <TopNavBar /> */}

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
                                text: 'Barrow',
                              },
                              {
                                id: 'dc2',
                                text: 'Beagle Sub-basin',
                              },
                              {
                                id: 'dc3',
                                text: 'Capreolus',
                              },
                              {
                                id: 'dc4',
                                text: 'Dampier Study',
                              },
                            ],
                          },
                          {
                            id: 'dc-new',
                            text: 'Create New Data Collection',
                            iconName: 'add-plus',
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
                            href: '/petrophysical-analysis',
                              },
                              {
                                id: 'ws2',
                                text: 'Insights',
                              },
                              {
                                id: 'ws3',
                                text: 'Geophysical',
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
                      {
                        type: 'menu-dropdown',
                        text: 'User Name',
                        description: 'email@example.com',
                        iconName: 'user-profile',
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
            </Providers>
          </FileSystemProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
