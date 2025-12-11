import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';
import Link from '@cloudscape-design/components/link';
import { cognitoAuth } from '@/lib/auth/cognitoAuth';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get username from navigation state
  const username = (location.state as any)?.username || '';
  
  // Form state
  const [verificationCode, setVerificationCode] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Redirect to sign-up if no username provided
  useEffect(() => {
    if (!username) {
      console.warn('⚠️ No username provided, redirecting to sign-up');
      navigate('/sign-up');
    }
  }, [username, navigate]);

  // Validate verification code format (6 digits)
  const validateCode = (code: string): string | null => {
    if (!code) {
      return 'Verification code is required';
    }
    if (!/^\d{6}$/.test(code)) {
      return 'Verification code must be 6 digits';
    }
    return null;
  };

  // Handle verification code input change
  const handleCodeChange = (value: string) => {
    setVerificationCode(value);
    setResendSuccess(false); // Clear resend success message when user types
    
    if (value) {
      const error = validateCode(value);
      setCodeError(error);
    } else {
      setCodeError(null);
    }
  };

  // Handle verification
  const handleVerify = async () => {
    // Clear previous errors
    setError(null);
    setResendSuccess(false);
    
    // Validate code
    const validationError = validateCode(verificationCode);
    if (validationError) {
      setCodeError(validationError);
      setError('Please enter a valid 6-digit verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔍 Attempting to verify email...');
      await cognitoAuth.confirmSignUp(username, verificationCode.trim());
      console.log('✅ Email verified successfully');
      
      // Navigate to sign-in page with success message
      navigate('/sign-in', { 
        state: { 
          successMessage: 'Email verified successfully! Please sign in with your credentials.' 
        } 
      });
    } catch (err: any) {
      console.error('❌ Email verification failed:', err);
      
      // Parse Cognito error messages
      let errorMessage = 'Verification failed. Please try again.';
      
      if (err.code === 'CodeMismatchException') {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (err.code === 'ExpiredCodeException') {
        errorMessage = 'Verification code expired. Please request a new one.';
      } else if (err.code === 'NotAuthorizedException') {
        errorMessage = 'Invalid verification code.';
      } else if (err.code === 'UserNotFoundException') {
        errorMessage = 'User not found. Please sign up first.';
      } else if (err.code === 'LimitExceededException' || err.code === 'TooManyRequestsException') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    // Clear previous messages
    setError(null);
    setResendSuccess(false);
    setCodeError(null);
    
    setResendLoading(true);
    
    try {
      console.log('📧 Resending verification code...');
      await cognitoAuth.resendConfirmationCode(username);
      console.log('✅ Verification code resent successfully');
      
      setResendSuccess(true);
      setVerificationCode(''); // Clear the input field
    } catch (err: any) {
      console.error('❌ Resend code failed:', err);
      
      // Parse Cognito error messages
      let errorMessage = 'Failed to resend code. Please try again.';
      
      if (err.code === 'LimitExceededException' || err.code === 'TooManyRequestsException') {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (err.code === 'UserNotFoundException') {
        errorMessage = 'User not found. Please sign up first.';
      } else if (err.code === 'InvalidParameterException') {
        errorMessage = 'Invalid request. Please try signing up again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  // Check if form is valid (code is 6 digits)
  const isFormValid = verificationCode && !codeError;

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
                  Verify Email
                </Box>
                <Box
                  variant="p"
                  color="text-body-secondary"
                >
                  Enter the verification code sent to your email
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

              {resendSuccess && (
                <Alert
                  type="success"
                  dismissible
                  onDismiss={() => setResendSuccess(false)}
                >
                  Verification code sent! Check your email.
                </Alert>
              )}

              <FormField
                label="Verification Code"
                stretch
                errorText={codeError || undefined}
                description="Enter the 6-digit code from your email"
              >
                <Input
                  value={verificationCode}
                  onChange={({ detail }) => handleCodeChange(detail.value)}
                  placeholder="000000"
                  disabled={loading || resendLoading}
                  autoComplete="one-time-code"
                  type="text"
                  inputMode="numeric"
                  invalid={!!codeError}
                  autoFocus
                />
              </FormField>

              <Button
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading || resendLoading || !isFormValid}
                onClick={handleVerify}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <Button
                variant="normal"
                fullWidth
                loading={resendLoading}
                disabled={loading || resendLoading}
                onClick={handleResendCode}
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </Button>

              <Box textAlign="center">
                <Box variant="p" color="text-body-secondary">
                  Already verified?{' '}
                  <Link
                    href="#"
                    onFollow={(e) => {
                      e.preventDefault();
                      setError(null); // Clear error state on navigation
                      setCodeError(null); // Clear code error on navigation
                      setResendSuccess(false); // Clear success message on navigation
                      navigate('/sign-in');
                    }}
                  >
                    Sign In
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

export default VerifyEmailPage;
