import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  SignInForm,
  SignUpForm,
  ConfirmSignUpForm,
  ForgotPasswordForm,
  ResetPasswordForm
} from './AuthComponents';
import NewPasswordForm from './NewPasswordForm';

// Auth flow states
const AUTH_STATES = {
  SIGN_IN: 'signIn',
  SIGN_UP: 'signUp',
  CONFIRM_SIGN_UP: 'confirmSignUp',
  FORGOT_PASSWORD: 'forgotPassword',
  RESET_PASSWORD: 'resetPassword',
  NEW_PASSWORD_REQUIRED: 'newPasswordRequired'
};

const AuthFlow = () => {
  const { isAuthenticated, isLoading, authChallenge } = useAuth();
  const [currentState, setCurrentState] = useState(AUTH_STATES.SIGN_IN);
  const [tempUsername, setTempUsername] = useState('');
  const [signInData, setSignInData] = useState(null);

  // Handle auth challenge changes
  React.useEffect(() => {
    if (authChallenge?.type === 'NEW_PASSWORD_REQUIRED') {
      setCurrentState(AUTH_STATES.NEW_PASSWORD_REQUIRED);
      setTempUsername(authChallenge.username);
    }
  }, [authChallenge]);

  // If user is authenticated, don't show auth flow
  if (isAuthenticated) {
    return null;
  }

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        <div>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          Checking authentication...
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Navigation functions
  const switchToSignIn = () => setCurrentState(AUTH_STATES.SIGN_IN);
  const switchToSignUp = () => setCurrentState(AUTH_STATES.SIGN_UP);
  const switchToForgotPassword = () => setCurrentState(AUTH_STATES.FORGOT_PASSWORD);
  
  const switchToConfirmSignUp = (username) => {
    setTempUsername(username);
    setCurrentState(AUTH_STATES.CONFIRM_SIGN_UP);
  };
  
  const switchToResetPassword = (username) => {
    setTempUsername(username);
    setCurrentState(AUTH_STATES.RESET_PASSWORD);
  };
  


  // Render current auth component based on state
  const renderAuthComponent = () => {
    switch (currentState) {
      case AUTH_STATES.SIGN_IN:
        return (
          <SignInForm
            onSwitchToSignUp={switchToSignUp}
            onSwitchToForgotPassword={switchToForgotPassword}
          />
        );
      
      case AUTH_STATES.SIGN_UP:
        return (
          <SignUpForm
            onSwitchToSignIn={switchToSignIn}
            onSwitchToConfirm={switchToConfirmSignUp}
          />
        );
      
      case AUTH_STATES.CONFIRM_SIGN_UP:
        return (
          <ConfirmSignUpForm
            username={tempUsername}
            onSwitchToSignIn={switchToSignIn}
            onBack={switchToSignUp}
          />
        );
      
      case AUTH_STATES.FORGOT_PASSWORD:
        return (
          <ForgotPasswordForm
            onSwitchToSignIn={switchToSignIn}
            onSwitchToReset={switchToResetPassword}
          />
        );
      
      case AUTH_STATES.RESET_PASSWORD:
        return (
          <ResetPasswordForm
            username={tempUsername}
            onSwitchToSignIn={switchToSignIn}
          />
        );
      
      case AUTH_STATES.NEW_PASSWORD_REQUIRED:
        return (
          <NewPasswordForm
            username={tempUsername}
            onComplete={() => {
              setCurrentState(AUTH_STATES.SIGN_IN);
            }}
            onCancel={switchToSignIn}
          />
        );
      
      default:
        return (
          <SignInForm
            onSwitchToSignUp={switchToSignUp}
            onSwitchToForgotPassword={switchToForgotPassword}
          />
        );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {renderAuthComponent()}
    </div>
  );
};

export default AuthFlow;
