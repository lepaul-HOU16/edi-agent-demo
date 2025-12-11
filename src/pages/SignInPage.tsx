import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';
import Link from '@cloudscape-design/components/link';
import { cognitoAuth } from '@/lib/auth/cognitoAuth';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    // Clear previous errors
    setError(null);
    
    // Validate inputs
    if (!username.trim()) {
      setError('Please enter your username or email');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔐 Attempting sign in...');
      await cognitoAuth.signIn(username.trim(), password);
      console.log('✅ Sign in successful, redirecting...');
      
      // Redirect to home page after successful sign-in
      navigate('/');
    } catch (err: any) {
      console.error('❌ Sign in failed:', err);
      
      // Handle NEW_PASSWORD_REQUIRED challenge
      if (err.code === 'NewPasswordRequired') {
        console.log('🔑 Password change required, redirecting...');
        navigate('/change-password', {
          state: {
            cognitoUser: err.cognitoUser,
            userAttributes: err.userAttributes,
          },
        });
        return;
      }
      
      // Parse Cognito error messages
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (err.code === 'NotAuthorizedException') {
        errorMessage = 'Incorrect username or password';
      } else if (err.code === 'UserNotFoundException') {
        errorMessage = 'User not found';
      } else if (err.code === 'UserNotConfirmedException') {
        errorMessage = 'Please verify your email address';
      } else if (err.code === 'PasswordResetRequiredException') {
        errorMessage = 'Password reset required';
      } else if (err.code === 'TooManyRequestsException') {
        errorMessage = 'Too many attempts. Please try again later';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignIn();
  };

  return (
    <div
      style={{
        backgroundImage: `url("/login/edi-bkgd.jpg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: 'calc(100% + 80px)',
        height: 'calc(100% + 80px)',
        marginLeft: '-40px',
        marginTop: '-40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
        <Container>
          <form onSubmit={handleFormSubmit}>
            <SpaceBetween size="l">
              <Box textAlign="center">
                <Box
                  fontSize="display-l"
                  fontWeight="bold"
                  variant="h1"
                  padding={{ bottom: 's' }}
                >
                  Sign In
                </Box>
                <Box
                  variant="p"
                  color="text-body-secondary"
                >
                  Energy Data Insights
                </Box>
              </Box>

              {error && (
                <Alert
                  type="error"
                  dismissible
                  onDismiss={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              <FormField
                label="Username or Email"
                stretch
              >
                <Input
                  value={username}
                  onChange={({ detail }) => setUsername(detail.value)}
                  placeholder="Enter your username or email"
                  disabled={loading}
                  autoComplete="username"
                  type="text"
                  onKeyDown={(e) => {
                    if (e.detail.key === 'Enter') {
                      handleSignIn();
                    }
                  }}
                />
              </FormField>

              <FormField
                label="Password"
                stretch
              >
                <Input
                  value={password}
                  onChange={({ detail }) => setPassword(detail.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  type="password"
                  autoComplete="current-password"
                  onKeyDown={(e) => {
                    if (e.detail.key === 'Enter') {
                      handleSignIn();
                    }
                  }}
                />
              </FormField>

              <Button
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
                onClick={handleSignIn}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Box textAlign="center">
                <Box variant="p" color="text-body-secondary">
                  Don't have an account?{' '}
                  <Link
                    href="#"
                    onFollow={(e) => {
                      e.preventDefault();
                      setError(null); // Clear error state on navigation
                      navigate('/sign-up');
                    }}
                  >
                    Create Account
                  </Link>
                </Box>
              </Box>
            </SpaceBetween>
          </form>
        </Container>
      </div>
    </div>
  );
};

export default SignInPage;
