'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';

/**
 * Logout page that handles the sign out process
 * This page will sign out the user and redirect to the home page
 */
export default function LogoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Log that we've reached the logout page
    console.log('Logout page loaded - handling sign out');
    
    const handleLogout = async () => {
      try {
        // Sign out using Amplify
        await signOut();
        console.log('Successfully signed out');
        
        // Give it a moment before redirecting
        setTimeout(() => {
          router.push('/api-test');
        }, 1000);
      } catch (error) {
        console.error('Error during sign out:', error);
        
        // Try to redirect anyway
        setTimeout(() => {
          router.push('/api-test');
        }, 1000);
      }
    };
    
    handleLogout();
  }, [router]);
  
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
