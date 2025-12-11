import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Container from '@cloudscape-design/components/container';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Button from '@cloudscape-design/components/button';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Box from '@cloudscape-design/components/box';
import Alert from '@cloudscape-design/components/alert';
import { cognitoAuth } from '@/lib/auth/cognitoAuth';
import { validatePassword, validatePasswordMatch } from '@/lib/auth/validation';

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get cognitoUser from navigation state
  const cognitoUser = (location.state as any)?.cognitoUser;
  const userAttributes = (location.state as any)?.userAttributes;
  
  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Redirect to sign-in if no cognitoUser provided
  useEffect(() => {
    if (!cognitoUser) {
      console.warn('⚠️ No cognitoUser provided, redirecting to sign-in');
      navigate('/sign-in');
    }
  }, [cognitoUser, navigate]);

  // Real-time validation
  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    if (value) {
      const error = validatePassword(value);
      setValidationErrors(prev => ({
        ...prev,
        newPassword: error || undefined,
      }));
      
      // Re-validate confirm password if it has a value
      if (confirmPassword) {
        const matchError = validatePasswordMatch(value, confirmPassword);
        setValidationErrors(prev => ({
          ...prev,
          confirmPassword: matchError || undefined,
        }));
      }
    } else {
      setValidationErrors(prev => {
        const { newPassword, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value) {
      const error = validatePasswordMatch(newPassword, value);
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: error || undefined,
      }));
    } else {
      setValidationErrors(prev => {
        const { confirmPassword, ...rest } = prev;
        return rest;
      });
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    // Clear previous errors
    setError(null);
    
    // Validate all fields
    const passwordError = validatePassword(newPassword);
    const confirmPasswordError = validatePasswordMatch(newPassword, confirmPassword);
    
    const errors: any = {};
    if (passwordError) errors.newPassword = passwordError;
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    
    // If there are validation errors, display them and prevent submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔑 Attempting to change password...');
      await cognitoAuth.completeNewPasswordChallenge(
        cognitoUser,
        newPassword,
        userAttributes
      );
      console.log('✅ Password changed successfully, redirecting...');
      
      // Navigate to home page after successful password change
      navigate('/');
    } catch (err: any) {
      console.error('❌ Password change failed:', err);
      
      // Parse Cognito error messages
      let errorMessage = 'Password change failed. Please try again.';
      
      if (err.code === 'InvalidPasswordException') {
        errorMessage = 'Password does not meet requirements.';
      } else if (err.code === 'InvalidParameterException') {
        errorMessage = 'Invalid password. Please check the requirements.';
      } else if (err.code === 'LimitExceededException') {
        errorMessage = 'Too many attempts. Please try again later.';
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
    handleChangePassword();
  };

  // Check if form is valid
  const isFormValid = newPassword && confirmPassword && 
                      Object.keys(validationErrors).length === 0;

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
                  Change Password
                </Box>
                <Box
                  variant="p"
                  color="text-body-secondary"
                >
                  Please set a new password for your account
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

              <Alert type="info">
                Your temporary password has expired. Please create a new password.
              </Alert>

              <FormField
                label="New Password"
                stretch
                errorText={validationErrors.newPassword}
                description="Must be at least 8 characters with uppercase, lowercase, number, and special character"
              >
                <Input
                  value={newPassword}
                  onChange={({ detail }) => handleNewPasswordChange(detail.value)}
                  placeholder="Enter your new password"
                  disabled={loading}
                  type="password"
                  autoComplete="new-password"
                  invalid={!!validationErrors.newPassword}
                  autoFocus
                />
              </FormField>

              <FormField
                label="Confirm New Password"
                stretch
                errorText={validationErrors.confirmPassword}
              >
                <Input
                  value={confirmPassword}
                  onChange={({ detail }) => handleConfirmPasswordChange(detail.value)}
                  placeholder="Confirm your new password"
                  disabled={loading}
                  type="password"
                  autoComplete="new-password"
                  invalid={!!validationErrors.confirmPassword}
                />
              </FormField>

              <Button
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading || !isFormValid}
                onClick={handleChangePassword}
              >
                {loading ? 'Changing password...' : 'Change Password'}
              </Button>
            </SpaceBetween>
          </form>
        </Container>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
