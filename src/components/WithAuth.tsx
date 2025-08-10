import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/OidcAuthContext';
import { redirect } from 'next/navigation';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthProtected(props: P) {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
      if (!isAuthenticated) {
        redirect('/auth')
      }
    }, [isAuthenticated]);

    if (isAuthenticated) {
      return <Component {...props} />;
    }

    return null;
  };
}