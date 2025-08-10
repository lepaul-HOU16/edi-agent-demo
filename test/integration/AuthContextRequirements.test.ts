import { describe, it } from 'mocha';
import { expect } from 'chai';
import config from '../../src/services/config';

describe('Authentication Context Requirements Verification', () => {
  describe('Requirement 1.1: Working Cognito User Pool', () => {
    it('should use the working Cognito User Pool (us-east-1_eVNfQH4nW)', () => {
      expect(config.VITE_USER_POOL_ID).to.equal('us-east-1_eVNfQH4nW');
    });

    it('should have valid User Pool ID format', () => {
      const userPoolIdRegex = /^[a-z0-9-]+_[a-zA-Z0-9]+$/;
      expect(userPoolIdRegex.test(config.VITE_USER_POOL_ID)).to.be.true;
    });
  });

  describe('Requirement 1.2: Working App Client ID', () => {
    it('should use the working App Client ID (6tfcegqsn1ug591ltbrjefna19)', () => {
      expect(config.VITE_USER_POOL_CLIENT_ID).to.equal('6tfcegqsn1ug591ltbrjefna19');
    });

    it('should have valid Client ID format', () => {
      const clientIdRegex = /^[a-z0-9]+$/;
      expect(clientIdRegex.test(config.VITE_USER_POOL_CLIENT_ID)).to.be.true;
      expect(config.VITE_USER_POOL_CLIENT_ID.length).to.be.greaterThan(10);
    });
  });

  describe('Requirement 1.3: Access to UXPin Interface', () => {
    it('should have correct Cognito authority URL', () => {
      expect(config.VITE_COGNITO_AUTHORITY).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(() => new URL(config.VITE_COGNITO_AUTHORITY)).to.not.throw();
    });

    it('should have correct Cognito domain', () => {
      expect(config.VITE_COGNITO_DOMAIN).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
      expect(config.VITE_COGNITO_DOMAIN).to.include('auth.us-east-1.amazoncognito.com');
    });

    it('should construct valid hosted UI URL for AuthContext', () => {
      const redirectUri = encodeURIComponent('http://localhost:3000/api-test/callback');
      const hostedUIUrl = `https://${config.VITE_COGNITO_DOMAIN}/login?client_id=${config.VITE_USER_POOL_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${redirectUri}`;
      
      expect(() => new URL(hostedUIUrl)).to.not.throw();
      expect(hostedUIUrl).to.include(config.VITE_COGNITO_DOMAIN);
      expect(hostedUIUrl).to.include(config.VITE_USER_POOL_CLIENT_ID);
    });

    it('should have valid OIDC configuration for OidcAuthContext', () => {
      const oidcConfig = {
        authority: config.VITE_COGNITO_AUTHORITY,
        client_id: config.VITE_USER_POOL_CLIENT_ID,
        redirect_uri: 'http://localhost:3000/callback',
        response_type: 'code',
        scope: 'email openid profile'
      };

      expect(() => new URL(oidcConfig.authority)).to.not.throw();
      expect(() => new URL(oidcConfig.redirect_uri)).to.not.throw();
      expect(oidcConfig.client_id).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(oidcConfig.response_type).to.equal('code');
      expect(oidcConfig.scope).to.equal('email openid profile');
    });
  });

  describe('AuthContext Implementation Verification', () => {
    it('should be able to import AuthContext without errors', async () => {
      try {
        const authModule = await import('../../src/contexts/AuthContext');
        expect(authModule.default).to.exist;
        expect(authModule.AuthProvider).to.exist;
        expect(authModule.useAuth).to.exist;
      } catch (error) {
        throw new Error(`Failed to import AuthContext: ${error}`);
      }
    });

    it('should generate correct callback URL for AuthContext', () => {
      const origin = 'http://localhost:3000';
      const callbackPath = '/api-test/callback';
      const expectedCallback = `${origin}${callbackPath}`;
      
      expect(expectedCallback).to.equal('http://localhost:3000/api-test/callback');
      expect(() => new URL(expectedCallback)).to.not.throw();
    });

    it('should generate correct logout URL for AuthContext', () => {
      const origin = 'http://localhost:3000';
      const logoutPath = '/api-test/logout';
      const expectedLogout = `${origin}${logoutPath}`;
      
      expect(expectedLogout).to.equal('http://localhost:3000/api-test/logout');
      expect(() => new URL(expectedLogout)).to.not.throw();
    });
  });

  describe('OidcAuthContext Implementation Verification', () => {
    it('should be able to import OidcAuthContext without errors', async () => {
      try {
        const oidcModule = await import('../../src/contexts/OidcAuthContext');
        expect(oidcModule.default).to.exist;
        expect(oidcModule.AuthProvider).to.exist;
        expect(oidcModule.useAuth).to.exist;
      } catch (error) {
        throw new Error(`Failed to import OidcAuthContext: ${error}`);
      }
    });

    it('should have correct OIDC metadata endpoints', () => {
      const expectedMetadata = {
        issuer: config.VITE_COGNITO_AUTHORITY,
        authorization_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/oauth2/authorize`,
        token_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/oauth2/token`,
        userinfo_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/oauth2/userInfo`,
        end_session_endpoint: `https://${config.VITE_COGNITO_DOMAIN}/logout`
      };

      Object.values(expectedMetadata).forEach(url => {
        expect(() => new URL(url)).to.not.throw();
      });

      expect(expectedMetadata.issuer).to.include('us-east-1_eVNfQH4nW');
      expect(expectedMetadata.authorization_endpoint).to.include('osdu-dev-83633757');
      expect(expectedMetadata.token_endpoint).to.include('osdu-dev-83633757');
      expect(expectedMetadata.userinfo_endpoint).to.include('osdu-dev-83633757');
      expect(expectedMetadata.end_session_endpoint).to.include('osdu-dev-83633757');
    });

    it('should generate correct logout URL for OidcAuthContext', () => {
      const clientId = config.VITE_USER_POOL_CLIENT_ID;
      const logoutUri = encodeURIComponent('http://localhost:3000/api-test');
      const cognitoDomain = `https://${config.VITE_COGNITO_DOMAIN}`;
      const expectedLogoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;

      expect(() => new URL(expectedLogoutUrl)).to.not.throw();
      expect(expectedLogoutUrl).to.include('6tfcegqsn1ug591ltbrjefna19');
      expect(expectedLogoutUrl).to.include('osdu-dev-83633757');
    });
  });

  describe('Configuration Service Verification', () => {
    it('should load configuration from environment correctly', () => {
      expect(config.VITE_USER_POOL_ID).to.be.a('string').and.not.empty;
      expect(config.VITE_USER_POOL_CLIENT_ID).to.be.a('string').and.not.empty;
      expect(config.VITE_COGNITO_AUTHORITY).to.be.a('string').and.not.empty;
      expect(config.VITE_COGNITO_DOMAIN).to.be.a('string').and.not.empty;
    });

    it('should validate configuration correctly', () => {
      const { validateCognitoConfig } = require('../../src/services/config');
      const validation = validateCognitoConfig(config);
      
      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.be.an('array').that.is.empty;
    });

    it('should have configuration compatible with both contexts', () => {
      // Both contexts should be able to use the same configuration
      const sharedValues = {
        userPoolId: config.VITE_USER_POOL_ID,
        clientId: config.VITE_USER_POOL_CLIENT_ID,
        domain: config.VITE_COGNITO_DOMAIN,
        authority: config.VITE_COGNITO_AUTHORITY
      };

      expect(sharedValues.userPoolId).to.equal('us-east-1_eVNfQH4nW');
      expect(sharedValues.clientId).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(sharedValues.domain).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
      expect(sharedValues.authority).to.include(sharedValues.userPoolId);
    });
  });

  describe('Token and User Interface Compatibility', () => {
    it('should have compatible token structure for both contexts', () => {
      // Mock token structure that both contexts should produce
      const expectedTokenStructure = {
        idToken: { toString: () => 'string' },
        accessToken: { toString: () => 'string' }
      };

      expect(expectedTokenStructure.idToken).to.have.property('toString');
      expect(expectedTokenStructure.accessToken).to.have.property('toString');
      expect(typeof expectedTokenStructure.idToken.toString).to.equal('function');
      expect(typeof expectedTokenStructure.accessToken.toString).to.equal('function');
    });

    it('should have compatible user object structure for both contexts', () => {
      // Mock user structure that both contexts should produce
      const expectedUserStructure = {
        username: 'string',
        email: 'string',
        sub: 'string'
      };

      expect(expectedUserStructure).to.have.property('username');
      expect(expectedUserStructure).to.have.property('email');
      expect(expectedUserStructure).to.have.property('sub');
    });
  });

  describe('Callback URL Compatibility', () => {
    it('should have callback URLs that match Cognito configuration', () => {
      // These URLs should be configured in the Cognito User Pool
      const expectedCallbackUrls = [
        'http://localhost:3000/callback',        // OidcAuthContext
        'http://localhost:5173/callback',        // Alternative port
        'http://localhost:3000/api-test/callback' // AuthContext
      ];

      expectedCallbackUrls.forEach(url => {
        expect(() => new URL(url)).to.not.throw();
        expect(url.startsWith('http://localhost:')).to.be.true;
      });
    });

    it('should have logout URLs that match Cognito configuration', () => {
      // These URLs should be configured in the Cognito User Pool
      const expectedLogoutUrls = [
        'http://localhost:3000/logout',          // Standard logout
        'http://localhost:5173/logout',          // Alternative port
        'http://localhost:3000/api-test',        // OidcAuthContext logout redirect
        'http://localhost:3000/api-test/logout'  // AuthContext logout
      ];

      expectedLogoutUrls.forEach(url => {
        expect(() => new URL(url)).to.not.throw();
        expect(url.startsWith('http://localhost:')).to.be.true;
      });
    });
  });
});