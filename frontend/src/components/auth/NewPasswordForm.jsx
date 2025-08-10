import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const NewPasswordForm = ({ username, onComplete, onCancel }) => {
  const { confirmNewPassword, isLoading, error } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [formError, setFormError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!newPassword || !givenName || !familyName) {
      setFormError('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    
    const result = await confirmNewPassword(newPassword, {
      given_name: givenName,
      family_name: familyName
    });
    
    if (result.success) {
      onComplete();
    } else {
      setFormError(result.error || 'Failed to change password');
    }
  };

  return (
    <div style={authStyles.container}>
      <h2 style={authStyles.title}>Change Your Password</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        You need to change your temporary password before continuing.
      </p>
      
      <form onSubmit={handleSubmit} style={authStyles.form}>
        <input
          type="text"
          placeholder="First Name"
          value={givenName}
          onChange={(e) => {
            setGivenName(e.target.value);
            setFormError('');
          }}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={familyName}
          onChange={(e) => {
            setFamilyName(e.target.value);
            setFormError('');
          }}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="New Password (min 8 characters)"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setFormError('');
          }}
          style={authStyles.input}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
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
          {isLoading ? 'Changing Password...' : 'Change Password'}
        </button>
        
        {(formError || error) && (
          <div style={authStyles.error}>
            {formError || error}
          </div>
        )}
      </form>
      
      <div style={authStyles.linkContainer}>
        <a onClick={onCancel} style={authStyles.link}>
          Cancel
        </a>
      </div>
    </div>
  );
};

export default NewPasswordForm;
