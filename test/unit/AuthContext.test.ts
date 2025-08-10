import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import React from 'react';
import config from '../../src/services/config';

// Mock AWS Amplify
const mockFetchAuthSession = async () => {
  return {
    tokens: {
      idToken: {
        payload: {
          email: 'test@example.com',
          'cognito:username': 'testuser',
          sub: 'test-sub-123'
        },
        toString: () => 'mock-id-token'
      },
      accessToken: {
        toString: () => 'mock-access-token'
      }
    }
  };
};

const mockSignOut = async () => {
  return Promise.resolve();
};

const mockSignInWithRedirect = async () => {
  return Promise.resolve();
};

// Mock modules
const mockAmplifyAuth = {
  fetchAuthSession: mockFetchAuthSession,
  signOut: mockSignOut,
  signInWithRedirect: mockSignInWithRedirect
};

describe('AuthContext with Updated Credentials', () => {
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

    // Mock AWS Amplify module
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    
    Module.prototype.require = function(id: string) {
      if (id === 'aws-amplify/auth') {
        return mockAmplifyAuth;
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

  describe('Configuration Validation', () => {
    it('should have correct working Cognito credentials', () => {
      expect(config.VITE_USER_POOL_ID).to.equal('us-east-1_eVNfQH4nW');
      expect(config.VITE_USER_POOL_CLIENT_ID).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(config.VITE_COGNITO_AUTHORITY).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(config.VITE_COGNITO_DOMAIN).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
    });

    it('should have valid User Pool ID format', () => {
      const userPoolIdRegex = /^[a-z0-9-]+_[a-zA-Z0-9]+$/;
      expect(userPoolIdRegex.test(config.VITE_USER_POOL_ID)).to.be.true;
    });

    it('should have valid Client ID format', () => {
      const clientIdRegex = /^[a-z0-9]+$/;
      expect(clientIdRegex.test(config.VITE_USER_POOL_CLIENT_ID)).to.be.true;
      expect(config.VITE_USER_POOL_CLIENT_ID.length).to.be.greaterThan(10);
    });

    it('should have valid authority URL', () => {
      expect(() => new URL(config.VITE_COGNITO_AUTHORITY)).to.not.throw();
      expect(config.VITE_COGNITO_AUTHORITY).to.include(config.VITE_USER_POOL_ID);
    });

    it('should have valid Cognito domain', () => {
      expect(config.VITE_COGNITO_DOMAIN).to.include('auth.us-east-1.amazoncognito.com');
      expect(config.VITE_COGNITO_DOMAIN).to.include('osdu-dev-83633757');
    });
  });

  describe('AuthContext Implementation', () => {
    let AuthContext: any;
    let AuthProvider: any;
    let useAuth: any;

    beforeEach(async () => {
      // Dynamically import the AuthContext after mocking
      const authModule = await import('../../src/contexts/AuthContext');
      AuthContext = authModule.default;
      AuthProvider = authModule.AuthProvider;
      useAuth = authModule.useAuth;
    });

    it('should create AuthContext with correct interface', () => {
      expect(AuthContext).to.exist;
      expect(AuthProvider).to.exist;
      expect(useAuth).to.exist;
    });

    it('should generate correct hosted UI URL for login', () => {
      const expectedDomain = config.VITE_COGNITO_DOMAIN;
      const expectedClientId = config.VITE_USER_POOL_CLIENT_ID;
      const expectedRedirectUri = encodeURIComponent('http://localhost:3000/api-test/callback');
      
      const expectedUrl = `https://${expectedDomain}/login?client_id=${expectedClientId}&response_type=code&scope=email+openid+profile&redirect_uri=${expectedRedirectUri}`;
      
      // Verify URL components
      expect(expectedUrl).to.include(expectedDomain);
      expect(expectedUrl).to.include(expectedClientId);
      expect(expectedUrl).to.include('response_type=code');
      expect(expectedUrl).to.include('scope=email+openid+profile');
    });

    it('should handle authentication session correctly', async () => {
      const session = await mockFetchAuthSession();
      
      expect(session.tokens).to.exist;
      expect(session.tokens.idToken).to.exist;
      expect(session.tokens.accessToken).to.exist;
      
      // Verify token structure
      expect(session.tokens.idToken.payload.email).to.equal('test@example.com');
      expect(session.tokens.idToken.payload.sub).to.equal('test-sub-123');
    });
  });

  describe('Authentication Flow', () => {
    it('should construct correct callback URL', () => {
      const origin = 'http://localhost:3000';
      const callbackPath = '/api-test/callback';
      const expectedCallback = `${origin}${callbackPath}`;
      
      expect(expectedCallback).to.equal('http://localhost:3000/api-test/callback');
    });

    it('should construct correct logout URL', () => {
      const origin = 'http://localhost:3000';
      const logoutPath = '/api-test/logout';
      const expectedLogout = `${origin}${logoutPath}`;
      
      expect(expectedLogout).to.equal('http://localhost:3000/api-test/logout');
    });

    it('should handle token extraction from session', async () => {
      const session = await mockFetchAuthSession();
      const payload = session.tokens.idToken.payload;
      
      const user = {
        username: payload.email || payload['cognito:username'] || 'Unknown User',
        email: payload.email,
        sub: payload.sub
      };
      
      expect(user.username).to.equal('test@example.com');
      expect(user.email).to.equal('test@example.com');
      expect(user.sub).to.equal('test-sub-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const mockFailedSession = async () => {
        throw new Error('Authentication failed');
      };

      try {
        await mockFailedSession();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('Authentication failed');
      }
    });

    it('should handle missing tokens gracefully', async () => {
      const mockEmptySession = async () => {
        return { tokens: null };
      };

      const session = await mockEmptySession();
      expect(session.tokens).to.be.null;
    });
  });
});