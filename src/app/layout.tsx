'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../contexts/OidcAuthContext';
import TopNavBar from '../components/TopNavBar';
import themes from '../theme';
import ConfigureAmplify from '../components/ConfigureAmplify';

interface RootLayoutProps {
  children: ReactNode;
}

/**
 * Root layout component for the application
 * Provides OIDC auth context and Material-UI theme for the entire application
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <ConfigureAmplify>
          <AuthProvider>
            <ThemeProvider theme={themes.light}>
              <CssBaseline />
              <TopNavBar />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </ConfigureAmplify>
      </body>
    </html>
  );
}
