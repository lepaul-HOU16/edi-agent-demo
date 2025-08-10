import React, { useState } from 'react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';

// Styles for the component
const styles = {
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
  linkContainer: {
    textAlign: 'center',
    marginTop: '15px'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

const DirectSignIn = () => {
  // State for initial sign-in
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State for new password challenge
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Challenge state
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting sign in with:', { username });
      
      const signInOutput = await signIn({
        username,
        password
      });
      
      console.log('Sign in result:', signInOutput);
      
      if (signInOutput.isSignedIn) {
        setMessage('Sign in successful! Redirecting...');
        window.location.reload(); // Reload to update auth state
      } else if (signInOutput.nextStep?.signInStep === 'CONFIRM_SIGN_IN' && 
                signInOutput.nextStep?.challengeName === 'NEW_PASSWORD_REQUIRED') {
        setMessage('You need to set a new password');
        setShowNewPasswordForm(true);
      } else {
        setError('Sign in failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Confirming sign in with new password');
      
      const confirmSignInOutput = await confirmSignIn({
        challengeResponse: newPassword
      });
      
      console.log('Confirm sign in result:', confirmSignInOutput);
      
      if (confirmSignInOutput.isSignedIn) {
        setMessage('Password changed successfully! Redirecting...');
        setTimeout(() => {
          window.location.reload(); // Reload to update auth state
        }, 1500);
      } else {
        setError('Failed to change password. Please try again.');
      }
    } catch (err) {
      console.error('Confirm sign in error:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {!showNewPasswordForm ? (
        // Initial sign-in form
        <>
          <h2 style={styles.title}>Sign In to OSDU</h2>
          <form onSubmit={handleSignIn} style={styles.form}>
            <input
              type="text"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            
            {error && <div style={styles.error}>{error}</div>}
            {message && <div style={styles.success}>{message}</div>}
          </form>
        </>
      ) : (
        // New password form
        <>
          <h2 style={styles.title}>Change Your Password</h2>
          <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
            You need to change your temporary password before continuing.
          </p>
          <form onSubmit={handleNewPassword} style={styles.form}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }}
              disabled={loading}
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
            
            {error && <div style={styles.error}>{error}</div>}
            {message && <div style={styles.success}>{message}</div>}
          </form>
        </>
      )}
    </div>
  );
};

export default DirectSignIn;
