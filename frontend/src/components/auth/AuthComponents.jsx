import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Shared styles for auth components
const authStyles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
    fontSize: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
  },
  button: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  error: {
    color: '#dc3545',
    fontSize: '14px',
    marginTop: '5px'
  },
  success: {
    color: '#28a745',
    fontSize: '14px',
    marginTop: '5px'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  },
  linkContainer: {
    textAlign: 'center',
    marginTop: '15px'
  }
};

// Sign In Component
export const SignInForm = ({ onSwitchToSignUp, onSwitchToForgotPassword }) => {
  const { signIn, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    const result = await signIn(formData.username, formData.password);
    
    if (result.success) {
      // Normal sign-in success - handled by AuthContext
    } else if (result.challengeType === 'NEW_PASSWORD_REQUIRED') {
      // NEW_PASSWORD_REQUIRED challenge is handled by AuthContext state
      console.log('New password required challenge detected');
    } else {
      setFormError(result.error || 'Sign in failed');
    }
  };

  return (
    <div style={authStyles.container}>
      <h2 style={authStyles.title}>Sign In to OSDU</h2>
      <form onSubmit={handleSubmit} style={authStyles.form}>
        <input
          type="text"
          name="username"
          placeholder="Username or Email"
          value={formData.username}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            ...authStyles.button,
            ...(isLoading ? authStyles.buttonDisabled : {})
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
        
        {(formError || error) && (
          <div style={authStyles.error}>
            {formError || error}
          </div>
        )}
      </form>
      
      <div style={authStyles.linkContainer}>
        <a onClick={onSwitchToForgotPassword} style={authStyles.link}>
          Forgot Password?
        </a>
        <br />
        <span>Don't have an account? </span>
        <a onClick={onSwitchToSignUp} style={authStyles.link}>
          Sign Up
        </a>
      </div>
    </div>
  );
};

// Sign Up Component
export const SignUpForm = ({ onSwitchToSignIn, onSwitchToConfirm }) => {
  const { signUp, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    given_name: ''
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.given_name) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    const result = await signUp(formData.username, formData.password, formData.email, {
      given_name: formData.given_name
    });
    
    if (result.success) {
      onSwitchToConfirm(formData.username);
    } else {
      setFormError(result.error || 'Sign up failed');
    }
  };

  return (
    <div style={authStyles.container}>
      <h2 style={authStyles.title}>Sign Up for OSDU</h2>
      <form onSubmit={handleSubmit} style={authStyles.form}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="text"
          name="given_name"
          placeholder="First Name"
          value={formData.given_name}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 8 characters)"
          value={formData.password}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            ...authStyles.button,
            ...(isLoading ? authStyles.buttonDisabled : {})
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
        
        {(formError || error) && (
          <div style={authStyles.error}>
            {formError || error}
          </div>
        )}
      </form>
      
      <div style={authStyles.linkContainer}>
        <span>Already have an account? </span>
        <a onClick={onSwitchToSignIn} style={authStyles.link}>
          Sign In
        </a>
      </div>
    </div>
  );
};

// Confirm Sign Up Component
export const ConfirmSignUpForm = ({ username, onSwitchToSignIn, onBack }) => {
  const { confirmSignUp, resendConfirmationCode, isLoading, error } = useAuth();
  const [confirmationCode, setConfirmationCode] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirmationCode) {
      setFormError('Please enter the confirmation code');
      return;
    }

    const result = await confirmSignUp(username, confirmationCode);
    
    if (result.success) {
      setSuccessMessage('Account confirmed successfully! You can now sign in.');
      setTimeout(() => onSwitchToSignIn(), 2000);
    } else {
      setFormError(result.error || 'Confirmation failed');
    }
  };

  const handleResendCode = async () => {
    const result = await resendConfirmationCode(username);
    if (result.success) {
      setSuccessMessage('Confirmation code resent to your email');
      setFormError('');
    } else {
      setFormError(result.error || 'Failed to resend code');
    }
  };

  return (
    <div style={authStyles.container}>
      <h2 style={authStyles.title}>Confirm Your Account</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        We've sent a confirmation code to your email. Please enter it below.
      </p>
      
      <form onSubmit={handleSubmit} style={authStyles.form}>
        <input
          type="text"
          placeholder="Confirmation Code"
          value={confirmationCode}
          onChange={(e) => {
            setConfirmationCode(e.target.value);
            setFormError('');
          }}
          style={authStyles.input}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            ...authStyles.button,
            ...(isLoading ? authStyles.buttonDisabled : {})
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Confirming...' : 'Confirm Account'}
        </button>
        
        {(formError || error) && (
          <div style={authStyles.error}>
            {formError || error}
          </div>
        )}
        
        {successMessage && (
          <div style={authStyles.success}>
            {successMessage}
          </div>
        )}
      </form>
      
      <div style={authStyles.linkContainer}>
        <a onClick={handleResendCode} style={authStyles.link}>
          Resend Code
        </a>
        <br />
        <a onClick={onBack} style={authStyles.link}>
          Back to Sign Up
        </a>
      </div>
    </div>
  );
};

// Forgot Password Component
export const ForgotPasswordForm = ({ onSwitchToSignIn, onSwitchToReset }) => {
  const { resetPassword, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username) {
      setFormError('Please enter your username or email');
      return;
    }

    const result = await resetPassword(username);
    
    if (result.success) {
      setSuccessMessage('Password reset code sent to your email');
      setTimeout(() => onSwitchToReset(username), 2000);
    } else {
      setFormError(result.error || 'Failed to send reset code');
    }
  };

  return (
    <div style={authStyles.container}>
      <h2 style={authStyles.title}>Reset Password</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        Enter your username or email to receive a password reset code.
      </p>
      
      <form onSubmit={handleSubmit} style={authStyles.form}>
        <input
          type="text"
          placeholder="Username or Email"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setFormError('');
          }}
          style={authStyles.input}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            ...authStyles.button,
            ...(isLoading ? authStyles.buttonDisabled : {})
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </button>
        
        {(formError || error) && (
          <div style={authStyles.error}>
            {formError || error}
          </div>
        )}
        
        {successMessage && (
          <div style={authStyles.success}>
            {successMessage}
          </div>
        )}
      </form>
      
      <div style={authStyles.linkContainer}>
        <a onClick={onSwitchToSignIn} style={authStyles.link}>
          Back to Sign In
        </a>
      </div>
    </div>
  );
};

// Reset Password Component
export const ResetPasswordForm = ({ username, onSwitchToSignIn }) => {
  const { confirmResetPassword, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    confirmationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.confirmationCode || !formData.newPassword || !formData.confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    const result = await confirmResetPassword(
      username, 
      formData.confirmationCode, 
      formData.newPassword
    );
    
    if (result.success) {
      setSuccessMessage('Password reset successfully! You can now sign in.');
      setTimeout(() => onSwitchToSignIn(), 2000);
    } else {
      setFormError(result.error || 'Password reset failed');
    }
  };

  return (
    <div style={authStyles.container}>
      <h2 style={authStyles.title}>Set New Password</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        Enter the code from your email and your new password.
      </p>
      
      <form onSubmit={handleSubmit} style={authStyles.form}>
        <input
          type="text"
          name="confirmationCode"
          placeholder="Confirmation Code"
          value={formData.confirmationCode}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="password"
          name="newPassword"
          placeholder="New Password (min 8 characters)"
          value={formData.newPassword}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm New Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          style={authStyles.input}
          disabled={isLoading}
        />
        <button
          type="submit"
          style={{
            ...authStyles.button,
            ...(isLoading ? authStyles.buttonDisabled : {})
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
        
        {(formError || error) && (
          <div style={authStyles.error}>
            {formError || error}
          </div>
        )}
        
        {successMessage && (
          <div style={authStyles.success}>
            {successMessage}
          </div>
        )}
      </form>
      
      <div style={authStyles.linkContainer}>
        <a onClick={onSwitchToSignIn} style={authStyles.link}>
          Back to Sign In
        </a>
      </div>
    </div>
  );
};
