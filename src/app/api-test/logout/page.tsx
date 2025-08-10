'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'react-oidc-context';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import config from '../../../services/config';

/**
 * Logout page using react-oidc-context
 * This page will handle the sign out process and redirect to the API test page
 */
export default function LogoutPage() {
  const router = useRouter();
  const auth = useAuth();
  
  useEffect(() => {
    console.log('Logout page loaded - handling sign out');
    
    const handleLogout = async () => {
      try {
        // Use OIDC's signoutRedirect
        console.log('Removing user via OIDC');
        await auth.removeUser();
        
        // Redirect to Cognito's logout endpoint for a complete logout
        console.log('Redirecting to Cognito logout endpoint');
        const clientId = config.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
        const logoutUri = encodeURIComponent(`${window.location.origin}/api-test`);
        const cognitoDomain = `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}`;
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
      } catch (error) {
        console.error('Error during logout:', error);
        
        // Redirect back to API test page even if there's an error
        setTimeout(() => {
          router.push('/api-test');
        }, 1000);
      }
    };
    
    handleLogout();
  }, [auth, router]);
  
  return (
    <Container header="Signing Out">
      <Box padding="l" textAlign="center">
        <SpaceBetween direction="vertical" size="l">
          <Spinner size="large" />
          <Box variant="h3">Signing you out...</Box>
          <Box variant="p">You will be redirected automatically when complete.</Box>
        </SpaceBetween>
      </Box>
    </Container>
  );
}
