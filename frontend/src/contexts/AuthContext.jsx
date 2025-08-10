import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { 
  getCurrentUser, 
  signOut, 
  signIn, 
  signUp, 
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  confirmSignIn
} from 'aws-amplify/auth';

// Configure Amplify
const configureAmplify = () => {
  try {
    Amplify.configure({
      Auth: {
        Cognito: {
          region: import.meta.env.VITE_AWS_REGION,
          userPoolId: import.meta.env.VITE_USER_POOL_ID,
          userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
          identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
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
    console.log('✅ Amplify configured successfully');
  } catch (error) {
    console.error('❌ Amplify configuration error:', error);
  }
};

// Configure Amplify when module loads
configureAmplify();

// Auth state management
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  tokens: null,
  authChallenge: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        error: null 
      };
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_AUTH_CHALLENGE':
      return { ...state, authChallenge: action.payload };
    case 'CLEAR_AUTH_CHALLENGE':
      return { ...state, authChallenge: null };
    case 'SIGN_OUT':
      return { 
        ...initialState, 
        isLoading: false 
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check current user on app load
  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_TOKENS', payload: {
        accessToken: session.tokens?.accessToken?.toString(),
        idToken: session.tokens?.idToken?.toString()
      }});
      
      console.log('✅ User authenticated:', user);
    } catch (error) {
      console.log('ℹ️ No user signed in:', error.message);
      dispatch({ type: 'SET_USER', payload: null });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sign in function
  const signInUser = async (username, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { isSignedIn, nextStep } = await signIn({ username, password });
      
      if (isSignedIn) {
        await checkCurrentUser();
        return { success: true };
      } else {
        console.log('Sign in next step:', nextStep);
        
        // Handle NEW_PASSWORD_REQUIRED challenge
        if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          dispatch({ type: 'SET_AUTH_CHALLENGE', payload: {
            type: 'NEW_PASSWORD_REQUIRED',
            username
          }});
          return { 
            success: false, 
            nextStep,
            challengeType: 'NEW_PASSWORD_REQUIRED'
          };
        }
        
        return { success: false, nextStep };
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Confirm new password for NEW_PASSWORD_REQUIRED challenge
  const confirmNewPassword = async (newPassword, userAttributes = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { isSignedIn, nextStep } = await confirmSignIn({
        challengeResponse: newPassword,
        options: {
          userAttributes
        }
      });
      
      if (isSignedIn) {
        await checkCurrentUser();
        dispatch({ type: 'CLEAR_AUTH_CHALLENGE' });
        return { success: true };
      } else {
        return { success: false, nextStep };
      }
    } catch (error) {
      console.error('❌ Confirm new password error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Sign up function
  const signUpUser = async (username, password, email) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { isSignUpComplete, userId, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });

      return { 
        success: true, 
        isSignUpComplete, 
        userId, 
        nextStep 
      };
    } catch (error) {
      console.error('❌ Sign up error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Confirm sign up
  const confirmSignUpUser = async (username, confirmationCode) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username,
        confirmationCode
      });

      return { success: true, isSignUpComplete, nextStep };
    } catch (error) {
      console.error('❌ Confirm sign up error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Resend confirmation code
  const resendConfirmationCode = async (username) => {
    try {
      await resendSignUpCode({ username });
      return { success: true };
    } catch (error) {
      console.error('❌ Resend code error:', error);
      return { success: false, error: error.message };
    }
  };

  // Reset password
  const resetUserPassword = async (username) => {
    try {
      const { nextStep } = await resetPassword({ username });
      return { success: true, nextStep };
    } catch (error) {
      console.error('❌ Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Confirm reset password
  const confirmResetUserPassword = async (username, confirmationCode, newPassword) => {
    try {
      await confirmResetPassword({
        username,
        confirmationCode,
        newPassword
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Confirm reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out function
  const signOutUser = async () => {
    try {
      await signOut();
      dispatch({ type: 'SIGN_OUT' });
      console.log('✅ User signed out');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get fresh tokens
  const getTokens = async () => {
    try {
      const session = await fetchAuthSession();
      const tokens = {
        accessToken: session.tokens?.accessToken?.toString(),
        idToken: session.tokens?.idToken?.toString()
      };
      dispatch({ type: 'SET_TOKENS', payload: tokens });
      return tokens;
    } catch (error) {
      console.error('❌ Get tokens error:', error);
      return null;
    }
  };

  const value = {
    ...state,
    signIn: signInUser,
    signUp: signUpUser,
    confirmSignUp: confirmSignUpUser,
    resendConfirmationCode,
    resetPassword: resetUserPassword,
    confirmResetPassword: confirmResetUserPassword,
    confirmNewPassword,
    signOut: signOutUser,
    getTokens,
    checkCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
