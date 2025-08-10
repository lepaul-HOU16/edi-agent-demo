import React from 'react';
import { Amplify } from 'aws-amplify';
import DirectSignIn from './components/auth/DirectSignIn';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION,
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN?.replace('https://', ''),
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_REDIRECT_URI],
          redirectSignOut: [import.meta.env.VITE_LOGOUT_URI],
          responseType: 'code'
        }
      }
    }
  }
});

const DirectSignInTest = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '12px 20px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '4px',
        marginBottom: '20px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <span style={{ marginRight: '10px' }}>🏗️</span>
        <strong>OSDU M25 Compliant Platform</strong>
        <span style={{ marginLeft: '15px', opacity: '0.9' }}>
          • AWS Cognito Authentication Test Page
        </span>
      </div>
      
      <DirectSignIn />
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e7f3ff',
        borderRadius: '4px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Environment Variables:</h3>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>Region: <span style={{ fontWeight: 'bold' }}>{import.meta.env.VITE_AWS_REGION || 'Not set'}</span></li>
          <li>User Pool ID: <span style={{ fontWeight: 'bold' }}>{import.meta.env.VITE_USER_POOL_ID || 'Not set'}</span></li>
          <li>Client ID: <span style={{ fontWeight: 'bold' }}>{import.meta.env.VITE_USER_POOL_CLIENT_ID || 'Not set'}</span></li>
        </ul>
      </div>
    </div>
  );
};

export default DirectSignInTest;
