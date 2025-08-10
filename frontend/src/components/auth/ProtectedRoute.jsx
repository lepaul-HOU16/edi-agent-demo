import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthFlow from './AuthFlow';

/**
 * ProtectedRoute component that renders children only if user is authenticated
 * Otherwise shows the authentication flow
 */
const ProtectedRoute = ({ children, fallback = null }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ fontSize: '18px', color: '#666' }}>
            Loading OSDU Platform...
          </p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // If not authenticated, show auth flow or fallback
  if (!isAuthenticated) {
    return fallback || <AuthFlow />;
  }

  // If authenticated, render the protected content
  return children;
};

export default ProtectedRoute;
