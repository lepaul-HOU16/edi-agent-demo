'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/OidcAuthContext';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout component for the API Test section that wraps children with Auth provider
 */
export default function ApiTestLayout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
