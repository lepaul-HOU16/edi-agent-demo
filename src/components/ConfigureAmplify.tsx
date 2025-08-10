'use client';
import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { generateClient } from "aws-amplify/data";
import config from '../services/config';
import amplifyOutputs from '../../amplify_outputs.json';
import { getErrorMessage, logError } from '../utils/errorHandling';

// Global flag to track Amplify readiness
declare global {
  var __AMPLIFY_READY__: boolean;
}

if (typeof window !== 'undefined') {
  window.__AMPLIFY_READY__ = false;
}

interface ConfigureAmplifyProps {
  children?: React.ReactNode;
}

const ConfigureAmplify: React.FC<ConfigureAmplifyProps> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const configureAmplify = async () => {
      try {
        // Log all available configurations for debugging
        console.log('Available configuration for Amplify:', {
          userPoolId: config.NEXT_PUBLIC_USER_POOL_ID,
          userPoolClientId: config.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
          region: config.NEXT_PUBLIC_AWS_REGION,
          cognitoAuthority: config.NEXT_PUBLIC_COGNITO_AUTHORITY,
          redirectUri: config.NEXT_PUBLIC_REDIRECT_URI,
          logoutUri: config.NEXT_PUBLIC_LOGOUT_URI,
          currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server-side',
          currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
        });

        // Use the explicit Cognito domain from the configuration file
        const cognitoDomain = config.NEXT_PUBLIC_COGNITO_DOMAIN;
        
        // Ensure there's no protocol prefix in the domain configuration
        const cognitoBaseDomain = cognitoDomain.replace(/^https?:\/\//, '');
        
        console.log('Configuring Amplify with Cognito:', {
          userPoolId: config.NEXT_PUBLIC_USER_POOL_ID,
          userPoolClientId: config.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
          domain: cognitoBaseDomain
        });

        // Configure Amplify using the amplify_outputs.json file with OAuth overrides
        const amplifyConfig = {
          ...amplifyOutputs,
          Auth: {
            Cognito: {
              userPoolId: config.NEXT_PUBLIC_USER_POOL_ID,
              userPoolClientId: config.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
              loginWith: {
                oauth: {
                  domain: cognitoBaseDomain,
                  scopes: ['openid', 'email', 'profile'],
                  redirectSignIn: [
                    'http://localhost:3000/callback',
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/callback`
                  ],
                  redirectSignOut: [
                    'http://localhost:3000/logout',
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/logout`
                  ],
                  responseType: 'code'
                }
              }
            }
          }
        };

        Amplify.configure(amplifyConfig, { ssr: true });
        
        // Configure token signing to ensure proper authentication
        cognitoUserPoolsTokenProvider.setKeyValueStorage({
          getItem: async (key) => {
            try {
              if (typeof window !== 'undefined') {
                return window.localStorage.getItem(key);
              }
              return null;
            } catch (e) {
              return null;
            }
          },
          setItem: async (key, value) => {
            try {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, value);
              }
            } catch (e) {
              console.error('Error setting token:', e);
            }
          },
          removeItem: async (key) => {
            try {
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
              }
            } catch (e) {
              console.error('Error removing token:', e);
            }
          },
          // Add the required clear method
          clear: async () => {
            try {
              if (typeof window !== 'undefined') {
                window.localStorage.clear();
              }
            } catch (e) {
              console.error('Error clearing storage:', e);
            }
          }
        });
        
        console.log('✅ Amplify configured successfully');
        
        // Test if generateClient actually works before marking as ready
        try {
          const testClient = generateClient();
          console.log('✅ generateClient test successful');
          if (typeof window !== 'undefined') {
            window.__AMPLIFY_READY__ = true;
          }
        } catch (error) {
          console.warn('⚠️ generateClient test failed, but continuing:', getErrorMessage(error));
          // Still mark as ready since basic config is done
          if (typeof window !== 'undefined') {
            window.__AMPLIFY_READY__ = true;
          }
        }
        
        setIsConfigured(true);
      } catch (error) {
        logError('❌ Amplify configuration error', error);
        if (typeof window !== 'undefined') {
          window.__AMPLIFY_READY__ = false;
        }
        setIsConfigured(true); // Still render children even if config fails
      }
    };

    configureAmplify();
  }, []);

  // Don't render children until Amplify is configured
  if (!isConfigured) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ConfigureAmplify;
