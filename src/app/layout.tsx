'use client';

import { Inter } from "next/font/google";

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';

import ConfigureAmplify from '@/components/ConfigureAmplify';
import Providers from '@/components/Providers';
// import TopNavBar from '@/components/TopNavBar';

import IconButton from '@mui/material/IconButton';
import Button from '@cloudscape-design/components/button';
import TopNavigation from "@cloudscape-design/components/top-navigation";
import Grid from '@cloudscape-design/components/grid';

import "./globals.css";
import "@aws-amplify/ui-react/styles.css";
import { FileSystemProvider } from "@/contexts/FileSystemContext";

import './app.scss';
import { type Schema } from "@/../amplify/data/resource";
import { generateClient } from 'aws-amplify/api';

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
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <AppRouterCacheProvider>
          <ConfigureAmplify />
          <FileSystemProvider>
            <Providers>
              <ThemeProvider theme={theme}>
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
                            text: 'Show All Canvases',
                            href: '/listChats',
                          },
                          {
                            id: 'ws',
                            text: 'Canvases',
                            items: [
                              {
                                id: 'ws1',
                                text: 'Petrophysical Analysis',
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


