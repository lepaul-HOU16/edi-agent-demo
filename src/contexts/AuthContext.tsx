'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { fetchAuthSession, signOut, signInWithRedirect } from 'aws-amplify/auth';
import config from '../services/config';

// Define the shape of our auth context
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

// Hook for easy context consumption
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [tokens, setTokens] = useState<any | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      const session = await fetchAuthSession();
      if (session && session.tokens) {
        setIsAuthenticated(true);
        setTokens(session.tokens);
        
        // Extract user info from tokens
        const payload = session.tokens.idToken?.payload;
        if (payload) {
          setUser({
            username: payload.email || payload['cognito:username'] || 'Unknown User',
            email: payload.email,
            sub: payload.sub
          });
        }
      } else {
        setIsAuthenticated(false);
        setTokens(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      setIsAuthenticated(false);
      setTokens(null);
      setUser(null);
    }
  };

  // Login with Cognito using the Hosted UI
  const login = async () => {
    console.log('Login button clicked');
    
    if (typeof window !== 'undefined') {
      console.log('Window object available, proceeding with login');
      
      // Use the correct callback URL as configured in the Cognito console
      const redirectUri = encodeURIComponent(`${window.location.origin}/callback`);
      
      // Use the explicit Cognito domain from the configuration
      // This should match the exact domain name configured in Cognito
      const hostedUIUrl = `https://${config.NEXT_PUBLIC_COGNITO_DOMAIN}/login?client_id=${config.NEXT_PUBLIC_USER_POOL_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
      
      console.log('Redirecting to hosted UI URL:', hostedUIUrl);
      
      // Redirect to the Cognito hosted UI
      try {
        window.location.href = hostedUIUrl;
      } catch (error) {
        console.error('Error redirecting to Cognito hosted UI:', error);
      }
    } else {
      console.log('Window object not available (server-side rendering)');
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log('Logout requested, redirecting to logout page');
      
      // Instead of directly calling signOut, redirect to the logout page
      // This ensures we handle the callback URLs properly for Cognito
      if (typeof window !== 'undefined') {
        window.location.href = `${window.location.origin}/logout`;
      } else {
        await signOut();
        setIsAuthenticated(false);
        setTokens(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      setTokens(null);
      setUser(null);
    }
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, tokens, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
