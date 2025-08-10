'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { AuthProvider as OidcAuthProvider, useAuth as useOidcAuth } from 'react-oidc-context';
import config from '../services/config';

// OIDC configuration based on AWS Cognito Console example
const oidcConfig = {
  authority: config.NEXT_PUBLIC_COGNITO_AUTHORITY,
  client_id: config.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
  redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/callback` : "http://localhost:3000/callback",
  response_type: "code",
  scope: "email openid profile",
  
  // Manual metadata since AWS Cognito doesn't support OIDC discovery
  metadata: {
    issuer: config.NEXT_PUBLIC_COGNITO_AUTHORITY,
    authorization_endpoint: `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/authorize`,
    token_endpoint: `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/token`,
    userinfo_endpoint: `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/userInfo`,
    end_session_endpoint: `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}/logout`,
    jwks_uri: `${config.NEXT_PUBLIC_COGNITO_AUTHORITY}/.well-known/jwks.json`,
  }
};

// Extend window interface for OIDC tokens
declare global {
  interface Window {
    __OIDC_TOKENS__?: {
      idToken: string;
      accessToken: string;
      timestamp: number;
    };
  }
}

// Create a context to wrap the OIDC auth and make it compatible with our existing code
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  tokens: any | null;
  login: () => void;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  tokens: null,
  login: () => {},
  logout: () => {},
});

// Export the hook for consuming the context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Wrap the OIDC AuthProvider with our own AuthProvider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <OidcAuthProvider {...oidcConfig}>
      <AuthConsumer>{children}</AuthConsumer>
    </OidcAuthProvider>
  );
};

// Internal component that consumes the OIDC context and adapts it to our interface
const AuthConsumer: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useOidcAuth();
  
  // Set tokens in window object for API service access
  React.useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      const idToken = auth.user.id_token;
      const accessToken = auth.user.access_token;
      
      if (idToken && accessToken && typeof window !== 'undefined') {
        window.__OIDC_TOKENS__ = {
          idToken,
          accessToken,
          timestamp: Date.now()
        };
        console.log('OIDC tokens set for API service access');
      }
    } else if (typeof window !== 'undefined') {
      // Clear tokens when not authenticated
      delete window.__OIDC_TOKENS__;
    }
  }, [auth.isAuthenticated, auth.user]);
  
  // Map OIDC auth to our auth interface
  const authState: AuthContextType = {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user?.profile ? {
      username: auth.user.profile.email || auth.user.profile.name || 'Unknown User',
      email: auth.user.profile.email,
      sub: auth.user.profile.sub
    } : null,
    tokens: auth.isAuthenticated ? {
      idToken: { toString: () => auth.user?.id_token || '' },
      accessToken: { toString: () => auth.user?.access_token || '' },
    } : null,
    
    // Login - Use OIDC's signinRedirect
    login: () => {
      console.log('Initiating login with OIDC signinRedirect');
      auth.signinRedirect();
    },
    
    // Logout - Use AWS Cognito logout endpoint as shown in the example
    logout: () => {
      console.log('Initiating logout with OIDC removeUser and redirect');
      
      // First try OIDC's built-in removal
      try {
        auth.removeUser();
      } catch (e) {
        console.error('Error removing user from OIDC:', e);
      }
      
      // Then redirect to Cognito's logout endpoint as shown in AWS example
      if (typeof window !== 'undefined') {
        const clientId = config.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
        const logoutUri = encodeURIComponent(`${window.location.origin}/logout`);
        const cognitoDomain = `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}`;
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
      }
    }
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
