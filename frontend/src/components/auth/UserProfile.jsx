import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserProfile = ({ compact = false }) => {
  const { user, signOut, isLoading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      setShowDropdown(false);
    }
  };

  // Compact version for navigation bars
  if (compact) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '20px',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span>{user.username}</span>
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '5px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            minWidth: '200px',
            zIndex: 1000
          }}>
            <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                User ID: {user.userId}
              </div>
            </div>
            <div style={{ padding: '10px' }}>
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  // Full profile component
  return (
    <div style={{
      maxWidth: '400px',
      margin: '20px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          marginRight: '15px'
        }}>
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>
            {user.username}
          </h3>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            OSDU Platform User
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
          Account Information
        </h4>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <div style={{ marginBottom: '5px' }}>
            <strong>User ID:</strong> {user.userId}
          </div>
          <div style={{ marginBottom: '5px' }}>
            <strong>Username:</strong> {user.username}
          </div>
          {user.attributes?.email && (
            <div style={{ marginBottom: '5px' }}>
              <strong>Email:</strong> {user.attributes.email}
            </div>
          )}
        </div>
      </div>

      <div style={{
        borderTop: '1px solid #eee',
        paddingTop: '20px'
      }}>
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
