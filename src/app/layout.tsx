'use client';

import { Inter } from "next/font/google";

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';

import ConfigureAmplify from '@/components/ConfigureAmplify';
import Providers from '@/components/Providers';
// import TopNavBar from '@/components/TopNavBar';

import TopNavigation from "@cloudscape-design/components/top-navigation";

import "./globals.css";
import "@aws-amplify/ui-react/styles.css";
import { FileSystemProvider } from "@/contexts/FileSystemContext";

import './app.scss';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Removed export of metadata from client component

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
                            text: 'Team',
                            href: '9c410c82ecd3b295323fb0542e67bb5076cbb05f#/pages/209228815/simulate/no-panels?mode=i',
                          },
                          {
                            id: 'export',
                            text: 'Export',
                            href: 'a840ad2ee0fb50ae52d45a6ee495ea3b4b0dabe6#/pages/201912794/simulate/no-panels?mode=i',
                          },
                          {
                            id: 'status',
                            text: 'System Status',
                            href: '9c410c82ecd3b295323fb0542e67bb5076cbb05f#/pages/209765582/simulate/no-panels?mode=i',
                          },
                          {
                            id: 'iq',
                            text: 'EDI IQ',
                            href: '',
                          },
                          {
                            id: 'transformer',
                            text: 'EDI Transformer',
                            href: '',
                          },
                          {
                            id: 'q',
                            text: 'Q Business Suite',
                            href: '',
                          },
                        ],
                      },
                      {
                        type: 'button',
                        iconName: 'notification',
                        title: 'Notifications',
                        ariaLabel: 'Notifications (unread)',
                        badge: true,
                        disableUtilityCollapse: false,
                      },
                      {
                        type: 'menu-dropdown',
                        text: 'User Name',
                        description: 'email@example.com',
                        iconName: 'user-profile',
                        items: [
                          {
                            id: 'profile',
                            text: 'Profile',
                          },
                          {
                            id: 'preferences',
                            text: 'Preferences',
                          },
                          {
                            id: 'security',
                            text: 'Security',
                          },
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


