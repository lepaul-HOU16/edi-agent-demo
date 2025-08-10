'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/OidcAuthContext';
import dynamic from 'next/dynamic';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Container from '@cloudscape-design/components/container';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import TestAPI from './api-test/TestAPI';
import config from '../services/config';

// This provides a dynamic import for the TestAPI component to prevent SSR issues
const TestAPIImport = dynamic(() => Promise.resolve(TestAPI),
  {
    ssr: false,
    loading: () => (
      <Container header="Loading TestAPI Component">
        <Box textAlign="center" padding="l">
          <SpaceBetween direction="vertical" size="m">
            <Spinner size="large" />
            <Box variant="p">Loading test interface...</Box>
          </SpaceBetween>
        </Box>
      </Container>
    )
  }
);

export default function TestAPIComponent() {
  // We no longer need to wrap with AuthProvider since it's provided in the layout
  return <TestAPIContent />;
}

// Inner component that uses the auth context
function TestAPIContent() {
  const { isAuthenticated, login, logout } = useAuth();

  const handleLoginToggle = () => {
    console.log('Login/Logout button clicked');
    
    if (isAuthenticated) {
      console.log('User is authenticated, logging out');
      logout();
    } else {
      console.log('User is not authenticated, initiating login');
      
      // Use the OIDC context login method instead of manual redirect
      login();
    }
  };

  // Alternative login that tries different endpoint path
  const handleDirectLogin = () => {
    if (typeof window !== 'undefined') {
      // Update redirect URI to match what's configured in Cognito console
      const redirectUri = encodeURIComponent(`${window.location.origin}/api-test/callback`);
      
      // Try with the login endpoint instead of oauth2/authorize
      const loginUrl = `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}/login?client_id=${config.NEXT_PUBLIC_USER_POOL_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
      
      console.log("Alternative login URL:", loginUrl);
      
      try {
        window.location.assign(loginUrl);
      } catch (e: any) {
        console.error("Failed to redirect:", e);
        alert("Failed to redirect: " + (e.message || 'Unknown error'));
      }
    } else {
      alert("Window object not available");
    }
  };
  
  return (
      <React.Fragment>
      <SpaceBetween direction="vertical" size="m">
        <Button onClick={handleLoginToggle}>
          {isAuthenticated ? "Logout" : "Login with Cognito"}
        </Button>
        
        {/* Emergency direct login button */}
        {!isAuthenticated && (
          <Button variant="primary" onClick={handleDirectLogin}>
            EMERGENCY DIRECT LOGIN
          </Button>
        )}
        
        {isAuthenticated ? (
          <TestAPIImport />
        ) : (
          <Container header="Authentication Required">
            <Box>
              <SpaceBetween direction="vertical" size="m">
                <Box variant="p">
                  You need to be logged in to access the API testing interface.
                </Box>
                <Button onClick={handleLoginToggle}>Login</Button>
              </SpaceBetween>
            </Box>
          </Container>
        )}
      </SpaceBetween>
      </React.Fragment>
  );
}
