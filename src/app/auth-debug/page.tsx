'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField
} from '@mui/material';
import { useAuth } from '@/contexts/OidcAuthContext';
import config from '@/services/config';

const AuthDebugPage: React.FC = () => {
  const auth = useAuth();
  const [testConfig, setTestConfig] = useState({
    userPoolId: config.NEXT_PUBLIC_USER_POOL_ID,
    clientId: config.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
    authority: config.NEXT_PUBLIC_COGNITO_AUTHORITY,
    domain: config.NEXT_PUBLIC_COGNITO_DOMAIN,
    redirectUri: config.NEXT_PUBLIC_REDIRECT_URI
  });

  const handleLogin = () => {
    console.log('Attempting login with config:', testConfig);
    auth.login();
  };

  const handleLogout = () => {
    console.log('Attempting logout');
    auth.logout();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Authentication Debug
      </Typography>
      
      {/* Current Auth State */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Authentication State
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Authenticated"
                secondary={auth.isAuthenticated ? 'Yes' : 'No'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="User"
                secondary={auth.user ? JSON.stringify(auth.user, null, 2) : 'None'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Has Tokens"
                secondary={auth.tokens ? 'Yes' : 'No'}
              />
            </ListItem>
          </List>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={auth.isAuthenticated}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              onClick={handleLogout}
              disabled={!auth.isAuthenticated}
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Current Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current OIDC Configuration
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="User Pool ID"
                secondary={testConfig.userPoolId}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Client ID"
                secondary={testConfig.clientId}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Authority"
                secondary={testConfig.authority}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Cognito Domain"
                secondary={testConfig.domain}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Redirect URI"
                secondary={testConfig.redirectUri}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Different Configurations
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Try different user pool configurations to see which one works
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setTestConfig({
                  userPoolId: 'us-east-1_eVNfQH4nW',
                  clientId: '6tfcegqsn1ug591ltbrjefna19',
                  authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW',
                  domain: 'osdu.auth.us-east-1.amazoncognito.com',
                  redirectUri: 'http://localhost:3000/callback'
                });
              }}
            >
              Use Original Working Config (LV35D0F5u)
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => {
                setTestConfig({
                  userPoolId: 'us-east-1_eVNfQH4nW',
                  clientId: '6tfcegqsn1ug591ltbrjefna19',
                  authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW',
                  domain: 'osdu-dev-83633757.auth.us-east-1.amazoncognito.com',
                  redirectUri: 'http://localhost:3000/callback'
                });
              }}
            >
              Use Newly Deployed Config (eVNfQH4nW)
            </Button>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            Note: Changing configuration here only shows what would be used. 
            To actually test, you need to update the .env.local file and restart the app.
          </Alert>
        </CardContent>
      </Card>

      {/* Manual Configuration Test */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manual Configuration URLs
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Test these URLs directly in your browser:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              label="Original Config Login URL"
              value={`https://osdu.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=6tfcegqsn1ug591ltbrjefna19&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}`}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              size="small"
            />
            
            <TextField
              label="New Config Login URL"
              value={`https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=6tfcegqsn1ug591ltbrjefna19&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}`}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              size="small"
            />
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            Copy one of these URLs and paste it in a new browser tab to test the authentication flow directly.
          </Alert>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AuthDebugPage;