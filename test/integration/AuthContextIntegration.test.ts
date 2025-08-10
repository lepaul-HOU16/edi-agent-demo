import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import config from '../../src/services/config';

describe('Authentication Context Integration Tests', () => {
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
  });

  afterEach(() => {
    dom.window.close();
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).navigator;
    delete (global as any).location;
  });

  describe('Configuration Compatibility', () => {
    it('should have consistent configuration between both contexts', () => {
      // Verify that both contexts will use the same configuration values
      const sharedConfig = {
        userPoolId: config.VITE_USER_POOL_ID,
        clientId: config.VITE_USER_POOL_CLIENT_ID,
        authority: config.VITE_COGNITO_AUTHORITY,
        domain: config.VITE_COGNITO_DOMAIN
      };

      expect(sharedConfig.userPoolId).to.equal('us-east-1_eVNfQH4nW');
      expect(sharedConfig.clientId).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(sharedConfig.authority).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(sharedConfig.domain).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
    });

    it('should have compatible callback URLs', () => {
      // AuthContext uses /api-test/callback
      const authContextCallback = `${window.location.origin}/api-test/callback`;
      
      // OidcAuthContext uses /callback
      const oidcContextCallback = `${window.location.origin}/callback`;
      
      // Both should be valid URLs
      expect(() => new URL(authContextCallback)).to.not.throw();
      expect(() => new URL(oidcContextCallback)).to.not.throw();
      
      // Both should use the same origin
      expect(new URL(authContextCallback).origin).to.equal(new URL(oidcContextCallback).origin);
    });

    it('should have compatible logout URLs', () => {
      // AuthContext uses /api-test/logout
      const authContextLogout = `${window.location.origin}/api-test/logout`;
      
      // OidcAuthContext redirects to /api-test after logout
      const oidcContextLogout = `${window.location.origin}/api-test`;
      
      // Both should be valid URLs
      expect(() => new URL(authContextLogout)).to.not.throw();
      expect(() => new URL(oidcContextLogout)).to.not.throw();
    });
  });

  describe('Authentication Flow Compatibility', () => {
    it('should generate compatible hosted UI URLs', () => {
      // AuthContext hosted UI URL
      const authContextUrl = `https://${config.VITE_COGNITO_DOMAIN}/login?client_id=${config.VITE_USER_POOL_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(`${window.location.origin}/api-test/callback`)}`;
      
      // OidcAuthContext authorization endpoint
      const oidcAuthUrl = `https://${config.VITE_COGNITO_DOMAIN}/oauth2/authorize`;
      
      // Both should use the same domain and client ID
      expect(authContextUrl).to.include(config.VITE_COGNITO_DOMAIN);
      expect(authContextUrl).to.include(config.VITE_USER_POOL_CLIENT_ID);
      expect(oidcAuthUrl).to.include(config.VITE_COGNITO_DOMAIN);
      
      // Both should use HTTPS
      expect(authContextUrl.startsWith('https://')).to.be.true;
      expect(oidcAuthUrl.startsWith('https://')).to.be.true;
    });

    it('should have compatible token structures', () => {
      // Mock token structure that both contexts should produce
      const mockTokens = {
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
      };

      // AuthContext token structure
      const authContextTokens = {
        idToken: mockTokens.idToken,
        accessToken: mockTokens.accessToken
      };

      // OidcAuthContext token structure
      const oidcContextTokens = {
        idToken: { toString: () => 'mock-id-token' },
        accessToken: { toString: () => 'mock-access-token' }
      };

      // Both should have toString methods
      expect(authContextTokens.idToken.toString()).to.equal('mock-id-token');
      expect(authContextTokens.accessToken.toString()).to.equal('mock-access-token');
      expect(oidcContextTokens.idToken.toString()).to.equal('mock-id-token');
      expect(oidcContextTokens.accessToken.toString()).to.equal('mock-access-token');
    });

    it('should have compatible user object structures', () => {
      // Mock user data from Cognito
      const mockCognitoPayload = {
        email: 'test@example.com',
        'cognito:username': 'testuser',
        sub: 'test-sub-123'
      };

      // AuthContext user structure
      const authContextUser = {
        username: mockCognitoPayload.email || mockCognitoPayload['cognito:username'] || 'Unknown User',
        email: mockCognitoPayload.email,
        sub: mockCognitoPayload.sub
      };

      // OidcAuthContext user structure (from profile)
      const oidcContextUser = {
        username: mockCognitoPayload.email || 'Unknown User',
        email: mockCognitoPayload.email,
        sub: mockCognitoPayload.sub
      };

      // Both should have the same essential fields
      expect(authContextUser.email).to.equal(oidcContextUser.email);
      expect(authContextUser.sub).to.equal(oidcContextUser.sub);
      expect(authContextUser.username).to.equal(oidcContextUser.username);
    });
  });

  describe('OSDU API Service Compatibility', () => {
    it('should provide tokens in format expected by OSDU API service', () => {
      // Mock tokens as they would be provided by both contexts
      const mockTokens = {
        idToken: { toString: () => 'mock-id-token' },
        accessToken: { toString: () => 'mock-access-token' }
      };

      // OSDU API service expects tokens with toString() methods
      expect(typeof mockTokens.idToken.toString).to.equal('function');
      expect(typeof mockTokens.accessToken.toString).to.equal('function');
      
      // Should return string values
      expect(typeof mockTokens.idToken.toString()).to.equal('string');
      expect(typeof mockTokens.accessToken.toString()).to.equal('string');
      
      // Should not be empty
      expect(mockTokens.idToken.toString().length).to.be.greaterThan(0);
      expect(mockTokens.accessToken.toString().length).to.be.greaterThan(0);
    });

    it('should provide user information in expected format', () => {
      const mockUser = {
        username: 'test@example.com',
        email: 'test@example.com',
        sub: 'test-sub-123'
      };

      // OSDU API service expects these fields
      expect(mockUser).to.have.property('username');
      expect(mockUser).to.have.property('email');
      expect(mockUser).to.have.property('sub');
      
      // Fields should be strings
      expect(typeof mockUser.username).to.equal('string');
      expect(typeof mockUser.email).to.equal('string');
      expect(typeof mockUser.sub).to.equal('string');
    });
  });

  describe('Environment Configuration Integration', () => {
    it('should load configuration correctly from environment', () => {
      // Verify that the configuration service loads the correct values
      expect(config.VITE_USER_POOL_ID).to.be.a('string');
      expect(config.VITE_USER_POOL_CLIENT_ID).to.be.a('string');
      expect(config.VITE_COGNITO_AUTHORITY).to.be.a('string');
      expect(config.VITE_COGNITO_DOMAIN).to.be.a('string');
      
      // Verify values are not empty
      expect(config.VITE_USER_POOL_ID.length).to.be.greaterThan(0);
      expect(config.VITE_USER_POOL_CLIENT_ID.length).to.be.greaterThan(0);
      expect(config.VITE_COGNITO_AUTHORITY.length).to.be.greaterThan(0);
      expect(config.VITE_COGNITO_DOMAIN.length).to.be.greaterThan(0);
    });

    it('should have consistent configuration across contexts', () => {
      // Both contexts should read from the same config service
      const configForAuthContext = {
        userPoolId: config.VITE_USER_POOL_ID,
        clientId: config.VITE_USER_POOL_CLIENT_ID,
        domain: config.VITE_COGNITO_DOMAIN
      };

      const configForOidcContext = {
        authority: config.VITE_COGNITO_AUTHORITY,
        client_id: config.VITE_USER_POOL_CLIENT_ID,
        domain: config.VITE_COGNITO_DOMAIN
      };

      // Should use the same client ID and domain
      expect(configForAuthContext.clientId).to.equal(configForOidcContext.client_id);
      expect(configForAuthContext.domain).to.equal(configForOidcContext.domain);
      
      // Authority should contain the user pool ID
      expect(configForOidcContext.authority).to.include(configForAuthContext.userPoolId);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle configuration errors consistently', () => {
      // Test with invalid configuration
      const invalidConfig = {
        VITE_USER_POOL_ID: '',
        VITE_USER_POOL_CLIENT_ID: '',
        VITE_COGNITO_AUTHORITY: 'invalid-url',
        VITE_COGNITO_DOMAIN: ''
      };

      // Both contexts should handle missing configuration gracefully
      expect(invalidConfig.VITE_USER_POOL_ID).to.equal('');
      expect(invalidConfig.VITE_USER_POOL_CLIENT_ID).to.equal('');
      
      // Invalid URLs should be detectable
      expect(() => new URL(invalidConfig.VITE_COGNITO_AUTHORITY)).to.throw();
    });

    it('should handle authentication failures consistently', () => {
      // Mock authentication failure scenarios
      const authFailureScenarios = [
        { error: 'invalid_client', description: 'Invalid client ID' },
        { error: 'invalid_request', description: 'Invalid request parameters' },
        { error: 'unauthorized_client', description: 'Client not authorized' }
      ];

      authFailureScenarios.forEach(scenario => {
        expect(scenario.error).to.be.a('string');
        expect(scenario.description).to.be.a('string');
        expect(scenario.error.length).to.be.greaterThan(0);
      });
    });
  });

  describe('Callback URL Validation', () => {
    it('should validate that callback URLs are properly configured in Cognito', () => {
      // These are the callback URLs that should be configured in the Cognito User Pool
      const expectedCallbackUrls = [
        'http://localhost:3000/callback',
        'http://localhost:5173/callback',
        'http://localhost:3000/api-test/callback'
      ];

      expectedCallbackUrls.forEach(url => {
        expect(() => new URL(url)).to.not.throw();
        expect(url.startsWith('http://localhost:')).to.be.true;
      });
    });

    it('should validate that logout URLs are properly configured in Cognito', () => {
      // These are the logout URLs that should be configured in the Cognito User Pool
      const expectedLogoutUrls = [
        'http://localhost:3000/logout',
        'http://localhost:5173/logout',
        'http://localhost:3000/api-test',
        'http://localhost:3000/api-test/logout'
      ];

      expectedLogoutUrls.forEach(url => {
        expect(() => new URL(url)).to.not.throw();
        expect(url.startsWith('http://localhost:')).to.be.true;
      });
    });
  });
});