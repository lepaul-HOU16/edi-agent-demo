import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';

// Mock process.env before importing config
const originalEnv = process.env;

describe('Config Service', () => {
  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clear module cache to ensure fresh imports
    delete require.cache[require.resolve('../../src/services/config.js')];
  });

  describe('Environment Variable Loading', () => {
    it('should load updated Cognito credentials from environment variables', () => {
      // Set the working Cognito credentials
      process.env.VITE_USER_POOL_ID = 'us-east-1_eVNfQH4nW';
      process.env.VITE_USER_POOL_CLIENT_ID = '6tfcegqsn1ug591ltbrjefna19';
      process.env.VITE_COGNITO_AUTHORITY = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW';
      process.env.VITE_COGNITO_DOMAIN = 'https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com';
      process.env.VITE_REDIRECT_URI = 'http://localhost:3000/callback';
      process.env.VITE_LOGOUT_URI = 'http://localhost:3000/logout';
      process.env.VITE_AWS_REGION = 'us-east-1';

      const config = require('../../src/services/config.js').default;

      expect(config.VITE_USER_POOL_ID).to.equal('us-east-1_eVNfQH4nW');
      expect(config.VITE_USER_POOL_CLIENT_ID).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(config.VITE_COGNITO_AUTHORITY).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
      expect(config.VITE_COGNITO_DOMAIN).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
      expect(config.VITE_REDIRECT_URI).to.equal('http://localhost:3000/callback');
      expect(config.VITE_LOGOUT_URI).to.equal('http://localhost:3000/logout');
      expect(config.VITE_AWS_REGION).to.equal('us-east-1');
    });

    it('should use default values when environment variables are not set', () => {
      // Clear relevant environment variables
      delete process.env.VITE_USER_POOL_ID;
      delete process.env.VITE_USER_POOL_CLIENT_ID;
      delete process.env.VITE_COGNITO_AUTHORITY;

      const config = require('../../src/services/config.js').default;

      expect(config.VITE_USER_POOL_ID).to.equal('us-east-1_eVNfQH4nW');
      expect(config.VITE_USER_POOL_CLIENT_ID).to.equal('6tfcegqsn1ug591ltbrjefna19');
      expect(config.VITE_COGNITO_AUTHORITY).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
    });

    it('should properly handle COGNITO_DOMAIN with https prefix removal', () => {
      process.env.VITE_COGNITO_DOMAIN = 'https://osdu-dev-83633757.auth.us-east-1.amazoncognito.com';

      const config = require('../../src/services/config.js').default;

      expect(config.VITE_COGNITO_DOMAIN).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
    });

    it('should handle COGNITO_DOMAIN without https prefix', () => {
      process.env.VITE_COGNITO_DOMAIN = 'osdu-dev-83633757.auth.us-east-1.amazoncognito.com';

      const config = require('../../src/services/config.js').default;

      expect(config.VITE_COGNITO_DOMAIN).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct Cognito configuration', () => {
      const { validateCognitoConfig } = require('../../src/services/config.js');
      
      const validConfig = {
        VITE_USER_POOL_ID: 'us-east-1_eVNfQH4nW',
        VITE_USER_POOL_CLIENT_ID: '6tfcegqsn1ug591ltbrjefna19',
        VITE_AWS_REGION: 'us-east-1',
        VITE_COGNITO_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW',
        VITE_COGNITO_DOMAIN: 'osdu-dev-83633757.auth.us-east-1.amazoncognito.com',
        VITE_REDIRECT_URI: 'http://localhost:3000/callback',
        VITE_LOGOUT_URI: 'http://localhost:3000/logout'
      };

      const result = validateCognitoConfig(validConfig);
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should detect missing required configuration parameters', () => {
      const { validateCognitoConfig } = require('../../src/services/config.js');
      
      const invalidConfig = {
        VITE_USER_POOL_ID: '',
        VITE_USER_POOL_CLIENT_ID: '',
        VITE_AWS_REGION: '',
        VITE_COGNITO_AUTHORITY: '',
        VITE_COGNITO_DOMAIN: '',
        VITE_REDIRECT_URI: '',
        VITE_LOGOUT_URI: ''
      };

      const result = validateCognitoConfig(invalidConfig);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('VITE_USER_POOL_ID is required');
      expect(result.errors).to.include('VITE_USER_POOL_CLIENT_ID is required');
      expect(result.errors).to.include('VITE_AWS_REGION is required');
      expect(result.errors).to.include('VITE_COGNITO_AUTHORITY is required');
      expect(result.errors).to.include('VITE_COGNITO_DOMAIN is required');
      expect(result.errors).to.include('VITE_REDIRECT_URI is required');
      expect(result.errors).to.include('VITE_LOGOUT_URI is required');
    });

    it('should validate User Pool ID format', () => {
      const { validateUserPoolId } = require('../../src/services/config.js');
      
      expect(validateUserPoolId('us-east-1_eVNfQH4nW')).to.be.true;
      expect(validateUserPoolId('us-west-2_ABC123def')).to.be.true;
      expect(validateUserPoolId('invalid-format')).to.be.false;
      expect(validateUserPoolId('us-east-1')).to.be.false;
      expect(validateUserPoolId('')).to.be.false;
    });

    it('should validate Client ID format', () => {
      const { validateClientId } = require('../../src/services/config.js');
      
      expect(validateClientId('6tfcegqsn1ug591ltbrjefna19')).to.be.true;
      expect(validateClientId('abcdefghijklmnop')).to.be.true;
      expect(validateClientId('short')).to.be.false;
      expect(validateClientId('invalid-chars!')).to.be.false;
      expect(validateClientId('')).to.be.false;
    });

    it('should validate URL format', () => {
      const { validateUrl } = require('../../src/services/config.js');
      
      expect(validateUrl('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW')).to.be.true;
      expect(validateUrl('http://localhost:3000/callback')).to.be.true;
      expect(validateUrl('invalid-url')).to.be.false;
      expect(validateUrl('')).to.be.false;
    });

    it('should detect invalid User Pool ID format in configuration', () => {
      const { validateCognitoConfig } = require('../../src/services/config.js');
      
      const configWithInvalidUserPoolId = {
        VITE_USER_POOL_ID: 'invalid-format',
        VITE_USER_POOL_CLIENT_ID: '6tfcegqsn1ug591ltbrjefna19',
        VITE_AWS_REGION: 'us-east-1',
        VITE_COGNITO_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW',
        VITE_COGNITO_DOMAIN: 'osdu-dev-83633757.auth.us-east-1.amazoncognito.com',
        VITE_REDIRECT_URI: 'http://localhost:3000/callback',
        VITE_LOGOUT_URI: 'http://localhost:3000/logout'
      };

      const result = validateCognitoConfig(configWithInvalidUserPoolId);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('VITE_USER_POOL_ID has invalid format. Expected format: region_poolId');
    });

    it('should detect invalid Client ID format in configuration', () => {
      const { validateCognitoConfig } = require('../../src/services/config.js');
      
      const configWithInvalidClientId = {
        VITE_USER_POOL_ID: 'us-east-1_eVNfQH4nW',
        VITE_USER_POOL_CLIENT_ID: 'short',
        VITE_AWS_REGION: 'us-east-1',
        VITE_COGNITO_AUTHORITY: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW',
        VITE_COGNITO_DOMAIN: 'osdu-dev-83633757.auth.us-east-1.amazoncognito.com',
        VITE_REDIRECT_URI: 'http://localhost:3000/callback',
        VITE_LOGOUT_URI: 'http://localhost:3000/logout'
      };

      const result = validateCognitoConfig(configWithInvalidClientId);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('VITE_USER_POOL_CLIENT_ID has invalid format');
    });

    it('should detect invalid URLs in configuration', () => {
      const { validateCognitoConfig } = require('../../src/services/config.js');
      
      const configWithInvalidUrls = {
        VITE_USER_POOL_ID: 'us-east-1_eVNfQH4nW',
        VITE_USER_POOL_CLIENT_ID: '6tfcegqsn1ug591ltbrjefna19',
        VITE_AWS_REGION: 'us-east-1',
        VITE_COGNITO_AUTHORITY: 'invalid-url',
        VITE_COGNITO_DOMAIN: 'osdu-dev-83633757.auth.us-east-1.amazoncognito.com',
        VITE_REDIRECT_URI: 'invalid-redirect',
        VITE_LOGOUT_URI: 'invalid-logout'
      };

      const result = validateCognitoConfig(configWithInvalidUrls);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('VITE_COGNITO_AUTHORITY must be a valid URL');
      expect(result.errors).to.include('VITE_REDIRECT_URI must be a valid URL');
      expect(result.errors).to.include('VITE_LOGOUT_URI must be a valid URL');
    });
  });

  describe('Configuration Completeness', () => {
    it('should have all required API endpoints configured', () => {
      const config = require('../../src/services/config.js').default;

      expect(config.VITE_SCHEMA_API_URL).to.be.a('string').and.not.be.empty;
      expect(config.VITE_ENTITLEMENTS_API_URL).to.be.a('string').and.not.be.empty;
      expect(config.VITE_LEGAL_API_URL).to.be.a('string').and.not.be.empty;
      expect(config.VITE_SEARCH_API_URL).to.be.a('string').and.not.be.empty;
      expect(config.VITE_STORAGE_API_URL).to.be.a('string').and.not.be.empty;
      expect(config.VITE_AI_API_URL).to.be.a('string').and.not.be.empty;
      expect(config.VITE_DATA_INGESTION_API_URL).to.be.a('string').and.not.be.empty;
      expect(config.VITE_SEISMIC_INGESTION_API_URL).to.be.a('string').and.not.be.empty;
    });

    it('should have all required AWS configuration parameters', () => {
      const config = require('../../src/services/config.js').default;

      expect(config.VITE_AWS_REGION).to.be.a('string').and.not.be.empty;
      expect(config.VITE_USER_POOL_ID).to.be.a('string').and.not.be.empty;
      expect(config.VITE_USER_POOL_CLIENT_ID).to.be.a('string').and.not.be.empty;
      expect(config.VITE_IDENTITY_POOL_ID).to.be.a('string').and.not.be.empty;
    });

    it('should have all required Cognito configuration parameters', () => {
      const config = require('../../src/services/config.js').default;

      expect(config.VITE_COGNITO_AUTHORITY).to.be.a('string').and.not.be.empty;
      expect(config.VITE_COGNITO_DOMAIN).to.be.a('string').and.not.be.empty;
      expect(config.VITE_REDIRECT_URI).to.be.a('string').and.not.be.empty;
      expect(config.VITE_LOGOUT_URI).to.be.a('string').and.not.be.empty;
    });

    it('should have OSDU configuration parameters', () => {
      const config = require('../../src/services/config.js').default;

      expect(config.VITE_DEFAULT_DATA_PARTITION).to.be.a('string').and.not.be.empty;
      expect(config.VITE_NODE_ENV).to.be.a('string').and.not.be.empty;
    });
  });

  describe('Working Cognito Credentials Integration', () => {
    it('should use the working Cognito User Pool ID by default', () => {
      const config = require('../../src/services/config.js').default;
      expect(config.VITE_USER_POOL_ID).to.equal('us-east-1_eVNfQH4nW');
    });

    it('should use the working Cognito Client ID by default', () => {
      const config = require('../../src/services/config.js').default;
      expect(config.VITE_USER_POOL_CLIENT_ID).to.equal('6tfcegqsn1ug591ltbrjefna19');
    });

    it('should use the correct Cognito Authority URL by default', () => {
      const config = require('../../src/services/config.js').default;
      expect(config.VITE_COGNITO_AUTHORITY).to.equal('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_eVNfQH4nW');
    });

    it('should use the correct Cognito Domain by default', () => {
      const config = require('../../src/services/config.js').default;
      expect(config.VITE_COGNITO_DOMAIN).to.equal('osdu-dev-83633757.auth.us-east-1.amazoncognito.com');
    });

    it('should validate the working credentials configuration', () => {
      const config = require('../../src/services/config.js').default;
      const { validateCognitoConfig } = require('../../src/services/config.js');

      const result = validateCognitoConfig(config);
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.empty;
    });
  });
});