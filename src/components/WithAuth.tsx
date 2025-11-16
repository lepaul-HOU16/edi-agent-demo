import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthProtected(props: P) {
    const navigate = useNavigate();
    // TODO: Implement proper auth check
    const authStatus = 'authenticated'; // Placeholder

    useEffect(() => {
      if (authStatus === 'unauthenticated') {
        navigate('/auth');
      }
    }, [authStatus, navigate]);

    if (authStatus === 'authenticated') {
      return <Component {...props} />;
    }

    return null;
  };
}