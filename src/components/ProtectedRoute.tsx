/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication.
 * Redirects to sign-in page if user is not authenticated.
 * Shows loading state while checking authentication status.
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { cognitoAuth } from '../lib/auth/cognitoAuth';
import { Spinner, Box } from '@cloudscape-design/components';

interface UserInfo {
  userId: string;
  username: string;
  email: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const authenticated = await cognitoAuth.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Get user info if authenticated
        const info = await cognitoAuth.getUserInfo();
        setUserInfo(info);
        console.log('✅ ProtectedRoute: User authenticated', info.username);
      } else {
        console.log('⚠️ ProtectedRoute: User not authenticated');
      }
    } catch (error) {
      console.error('❌ ProtectedRoute: Authentication check failed', error);
      setIsAuthenticated(false);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box textAlign="center" padding={{ top: 'xxxl' }}>
        <Spinner size="large" />
        <Box variant="p" color="text-body-secondary" margin={{ top: 's' }}>
          Checking authentication...
        </Box>
      </Box>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    console.log('🔄 ProtectedRoute: Redirecting to sign-in');
    return <Navigate to="/sign-in" replace />;
  }

  // Pass user context to children components via React Context or props
  // For now, children can access user info via cognitoAuth.getUserInfo()
  return <>{children}</>;
};

export default ProtectedRoute;
