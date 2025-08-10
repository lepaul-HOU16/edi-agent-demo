'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';

/**
 * Standard callback page for Cognito authentication
 * This page is using react-oidc-context to process the authentication code
 */
export default function CallbackPage() {
  const router = useRouter();
  const auth = useAuth();
  
  useEffect(() => {
    console.log('Standard Callback page loaded with OIDC context');
    console.log('Auth state:', { 
      isLoading: auth.isLoading, 
      isAuthenticated: auth.isAuthenticated,
      error: auth.error ? auth.error.message : null 
    });
    
    // When auth is no longer loading and is authenticated, redirect to the API test page
    if (!auth.isLoading && auth.isAuthenticated) {
      console.log('Successfully authenticated with OIDC - redirecting to API test page');
      setTimeout(() => {
        router.push('/api-test');
      }, 1000);
    }
    
    // If auth is no longer loading and there was an error, the error will display
  }, [auth.isLoading, auth.isAuthenticated, auth.error, router]);
  
  // Handle error state
  if (auth.error) {
    return (
      <Container header="Authentication Error">
        <Box padding="l" textAlign="center">
          <SpaceBetween direction="vertical" size="l">
            <Box variant="h2" color="text-status-error">
              Authentication failed
            </Box>
            <Box variant="p">
              Error: {auth.error.message}
            </Box>
            <Box variant="p">
              <a href="/api-test">Return to login</a>
            </Box>
          </SpaceBetween>
        </Box>
      </Container>
    );
  }
  
  // Handle loading state
  return (
    <Container header="Authentication Complete">
      <Box padding="l" textAlign="center">
        <SpaceBetween direction="vertical" size="l">
          <Spinner size="large" />
          <Box variant="h3">Completing authentication...</Box>
          <Box variant="p">You will be redirected automatically when complete.</Box>
        </SpaceBetween>
      </Box>
    </Container>
  );
}
