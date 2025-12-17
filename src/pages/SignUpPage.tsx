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
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  ValidationErrors,
} from '@/lib/auth/validation';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Real-time validation on input change
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value) {
      const error = validateUsername(value);
      setValidationErrors(prev => ({
        ...prev,
        username: error || undefined,
      }));
    } else {
      setValidationErrors(prev => {
        const { username, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value) {
      const error = validateEmail(value);
      setValidationErrors(prev => ({
        ...prev,
        email: error || undefined,
      }));
    } else {
      setValidationErrors(prev => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const error = validatePassword(value);
      setValidationErrors(prev => ({
        ...prev,
        password: error || undefined,
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
        const { password, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value) {
      const error = validatePasswordMatch(password, value);
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

  // Form submission
  const handleSignUp = async () => {
    // Clear previous errors
    setError(null);
    
    // Validate all fields
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validatePasswordMatch(password, confirmPassword);
    
    const errors: ValidationErrors = {};
    if (usernameError) errors.username = usernameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    
    // If there are validation errors, display them and prevent submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix the validation errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('📝 Attempting sign up...');
      // Cognito User Pool is configured to use email as username
      // Pass email as both username and email attribute
      await cognitoAuth.signUp(email.trim(), email.trim(), password);
      console.log('✅ Sign up successful, redirecting to verification...');
      
      // Navigate to verification page with email (which is the username in Cognito)
      navigate('/verify-email', { state: { username: email.trim() } });
    } catch (err: any) {
      console.error('❌ Sign up failed:', err);
      
      // Parse Cognito error messages
      let errorMessage = 'Sign up failed. Please try again.';
      
      if (err.code === 'UsernameExistsException') {
        errorMessage = 'Username already taken. Please choose another.';
      } else if (err.code === 'InvalidParameterException') {
        if (err.message.includes('email')) {
          errorMessage = 'Email already registered. Please use a different email or sign in.';
        } else {
          errorMessage = 'Invalid input. Please check your information.';
        }
      } else if (err.code === 'InvalidPasswordException') {
        errorMessage = 'Password does not meet requirements.';
      } else if (err.code === 'TooManyRequestsException') {
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
    handleSignUp();
  };

  // Check if form is valid (all fields filled and no validation errors)
  const hasErrors = Object.values(validationErrors).some(error => error !== undefined);
  const isFormValid = username && email && password && confirmPassword && !hasErrors;

  return (
    <div
      className="hero-header"
      style={{
        backgroundImage: `url("/login/edi-bkgd.jpg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100vh',
        margin: '0',
        padding: '50px',
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
                  Create Account
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
                label="Display Name"
                stretch
                errorText={validationErrors.username}
                description="This is how your name will appear in the system"
              >
                <Input
                  value={username}
                  onChange={({ detail }) => handleUsernameChange(detail.value)}
                  placeholder="Enter your display name"
                  disabled={loading}
                  autoComplete="name"
                  type="text"
                  invalid={!!validationErrors.username}
                />
              </FormField>

              <FormField
                label="Email"
                stretch
                errorText={validationErrors.email}
              >
                <Input
                  value={email}
                  onChange={({ detail }) => handleEmailChange(detail.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="email"
                  type="email"
                  invalid={!!validationErrors.email}
                />
              </FormField>

              <FormField
                label="Password"
                stretch
                errorText={validationErrors.password}
                description="Must be at least 8 characters with uppercase, lowercase, number, and special character"
              >
                <Input
                  value={password}
                  onChange={({ detail }) => handlePasswordChange(detail.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  type="password"
                  autoComplete="new-password"
                  invalid={!!validationErrors.password}
                />
              </FormField>

              <FormField
                label="Confirm Password"
                stretch
                errorText={validationErrors.confirmPassword}
              >
                <Input
                  value={confirmPassword}
                  onChange={({ detail }) => handleConfirmPasswordChange(detail.value)}
                  placeholder="Confirm your password"
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
                onClick={handleSignUp}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <Box textAlign="center">
                <Box variant="p" color="text-body-secondary">
                  Already have an account?{' '}
                  <Link
                    href="#"
                    onFollow={(e) => {
                      e.preventDefault();
                      setError(null); // Clear error state on navigation
                      setValidationErrors({}); // Clear validation errors on navigation
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

export default SignUpPage;
