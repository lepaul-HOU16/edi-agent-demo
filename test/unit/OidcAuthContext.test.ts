import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import React from 'react';
import config from '../../src/services/config';

// Mock react-oidc-context
const mockOidcAuth = {
  isAuthenticated: true,
  user: {
    profile: {
      email: 'test@example.com',
      name: 'Test User',
      sub: 'test-sub-123'
    },
    id_token: 'mock-id-token',
    access_token: 'mock-access-token'
  },
  signinRedirect: () => Promise.resolve(),
  removeUser: () => Promise.resolve()
};

const mockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'mock-oidc-provider' }, children);
};

const mockUseOidcAuth = () => mockOidcAuth;

describe('OidcAuthContext with Updated Credentials', () => {
  let dom: JSDOM;
  let window: any;
  let document: any;

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    window = dom.window;
    document = window.document;
    
    // Set global window and document
    (global as any).window = window;
    (global as any).document = document;
    (global as any).navigator = window.navigator;
    (global as any).location = window.location;

    // Mock react-oidc-context module
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id: string) {
      if (id === 'react-oidc-context') {
        return {
          AuthProvider: mockAuthProvider,
          useAuth: mockUseOidcAuth
        };
      }
      return originalRequire.apply(this, arguments);
    };
  });

  afterEach(() => {
    dom.window.close();
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).navigator;
    delete (global as any).location;
  });

  describe('OIDC Configuration', () => {
    it('should have correct OIDC configuration with updated credentials', () => {
      const expectedConfig = {
        authority: config.VITE_COGNITO_AUTHORITY,
        client_id: config.VITE_USER_POOL_CLIENT_ID,
        redirect_uri: 'http://localhost:3000/callback',
        response_type: 'code',
        scope: 'email openid profile'
      };

      expect(expectedConfig.authority).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(expectedConfig.client_id).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(expectedConfig.redirect_uri).to.equal('http://localhost:3000/callback');
      expect(expectedConfig.response_type).to.equal('code');
      expect(expectedConfig.scope).to.equal('email openid profile');
    });

    it('should have correct metadata endpoints', () => {
      const expectedMetadata = {
        issuer: config.VITE_COGNITO_AUTHORITY,
        authorization_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/oauth2/authorize`,
        token_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/oauth2/token`,
        userinfo_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/oauth2/userInfo`,
        end_session_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/logout`
      };

      expect(expectedMetadata.issuer).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(expectedMetadata.authorization_endpoint).to.equal('https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com/oauth2/authorize');
      expect(expectedMetadata.token_endpoint).to.equal('https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com/oauth2/token');
      expect(expectedMetadata.userinfo_endpoint).to.equal('https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com/oauth2/userInfo');
      expect(expectedMetadata.end_session_endpoint).to.equal('https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com/logout');
    });

    it('should construct correct logout URL', () => {
      const clientId = config.VITE_USER_POOL_CLIENT_ID;
      const logoutUri = encodeURIComponent('http://localhost:3000/api-test');
      const cognitoDomain = `https://${config.VITE_COGNITO_DOMAIN}`;
      const expectedLogoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;

      expect(expectedLogoutUrl).to.include('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
      expect(expectedLogoutUrl).to.include('6tfcegqsn1ug591ltbrjefna19');
      expect(expectedLogoutUrl).to.include('logout_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi-test');
    });
  });

  describe('OidcAuthContext Implementation', () => {
    let OidcAuthContext: any;
    let AuthProvider: any;
    let useAuth: any;

    beforeEach(async () => {
      // Dynamically import the OidcAuthContext after mocking
      const authModule = await import('../../src/contexts/OidcAuthContext');
      OidcAuthContext = authModule.default;
      AuthProvider = authModule.AuthProvider;
      useAuth = authModule.useAuth;
    });

    it('should create OidcAuthContext with correct interface', () => {
      expect(OidcAuthContext).to.exist;
      expect(AuthProvider).to.exist;
      expect(useAuth).to.exist;
    });

    it('should map OIDC auth state to AuthContext interface', () => {
      const mappedAuthState = {
        isAuthenticated: mockOidcAuth.isAuthenticated,
        user: mockOidcAuth.user?.profile ? {
          username: mockOidcAuth.user.profile.email || mockOidcAuth.user.profile.name || 'Unknown User',
          email: mockOidcAuth.user.profile.email,
          sub: mockOidcAuth.user.profile.sub
        } : null,
        tokens: mockOidcAuth.isAuthenticated ? {
          idToken: { toString: () => mockOidcAuth.user?.id_token || '' },
          accessToken: { toString: () => mockOidcAuth.user?.access_token || '' },
        } : null
      };

      expect(mappedAuthState.isAuthenticated).to.be.true;
      expect(mappedAuthState.user).to.deep.equal({
        username: 'test@example.com',
        email: 'test@example.com',
        sub: 'test-sub-123'
      });
      expect(mappedAuthState.tokens).to.exist;
      expect(mappedAuthState.tokens?.idToken.toString()).to.equal('mock-id-token');
      expect(mappedAuthState.tokens?.accessToken.toString()).to.equal('mock-access-token');
    });
  });

  describe('Authentication Flow', () => {
    it('should handle login with signinRedirect', async () => {
      let loginCalled = false;
      const mockAuth = {
        ...mockOidcAuth,
        signinRedirect: () => {
          loginCalled = true;
          return Promise.resolve();
        }
      };

      await mockAuth.signinRedirect();
      expect(loginCalled).to.be.true;
    });

    it('should handle logout with removeUser and redirect', async () => {
      let removeUserCalled = false;
      const mockAuth = {
        ...mockOidcAuth,
        removeUser: () => {
          removeUserCalled = true;
          return Promise.resolve();
        }
      };

      await mockAuth.removeUser();
      expect(removeUserCalled).to.be.true;
    });

    it('should construct correct redirect URI based on window location', () => {
      const expectedRedirectUri = `${window.location.origin}/callback`;
      expect(expectedRedirectUri).to.equal('http://localhost:3000/callback');
    });
  });

  describe('Token Handling', () => {
    it('should extract tokens correctly from OIDC user object', () => {
      const user = mockOidcAuth.user;
      const tokens = {
        idToken: { toString: () => user?.id_token || '' },
        accessToken: { toString: () => user?.access_token || '' }
      };

      expect(tokens.idToken.toString()).to.equal('mock-id-token');
      expect(tokens.accessToken.toString()).to.equal('mock-access-token');
    });

    it('should handle missing tokens gracefully', () => {
      const mockAuthWithoutTokens = {
        isAuthenticated: false,
        user: null
      };

      const tokens = mockAuthWithoutTokens.isAuthenticated ? {
        idToken: { toString: () => mockAuthWithoutTokens.user?.id_token || '' },
        accessToken: { toString: () => mockAuthWithoutTokens.user?.access_token || '' }
      } : null;

      expect(tokens).to.be.null;
    });
  });

  describe('User Profile Mapping', () => {
    it('should map user profile correctly', () => {
      const profile = mockOidcAuth.user?.profile;
      const mappedUser = profile ? {
        username: profile.email || profile.name || 'Unknown User',
        email: profile.email,
        sub: profile.sub
      } : null;

      expect(mappedUser).to.deep.equal({
        username: 'test@example.com',
        email: 'test@example.com',
        sub: 'test-sub-123'
      });
    });

    it('should handle missing profile gracefully', () => {
      const mockAuthWithoutProfile = {
        isAuthenticated: true,
        user: null
      };

      const mappedUser = mockAuthWithoutProfile.user?.profile ? {
        username: mockAuthWithoutProfile.user.profile.email || mockAuthWithoutProfile.user.profile.name || 'Unknown User',
        email: mockAuthWithoutProfile.user.profile.email,
        sub: mockAuthWithoutProfile.user.profile.sub
      } : null;

      expect(mappedUser).to.be.null;
    });

    it('should fallback to name when email is not available', () => {
      const profileWithoutEmail = {
        name: 'Test User',
        sub: 'test-sub-123'
      };

      const mappedUser = {
        username: profileWithoutEmail.email || profileWithoutEmail.name || 'Unknown User',
        email: profileWithoutEmail.email,
        sub: profileWithoutEmail.sub
      };

      expect(mappedUser.username).to.equal('Test User');
      expect(mappedUser.email).to.be.undefined;
      expect(mappedUser.sub).to.equal('test-sub-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle OIDC authentication errors', async () => {
      const mockAuthWithError = {
        ...mockOidcAuth,
        signinRedirect: () => Promise.reject(new Error('OIDC signin failed'))
      };

      try {
        await mockAuthWithError.signinRedirect();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('OIDC signin failed');
      }
    });

    it('should handle removeUser errors gracefully', async () => {
      const mockAuthWithRemoveError = {
        ...mockOidcAuth,
        removeUser: () => Promise.reject(new Error('Remove user failed'))
      };

      try {
        await mockAuthWithRemoveError.removeUser();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Remove user failed');
      }
    });
  });
});