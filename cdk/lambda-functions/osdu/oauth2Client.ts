/**
 * UNUSED - OAuth2 Client for Amazon Federate Authentication
 * 
 * This file is commented out because we're using Option B (colleague's serverless API)
 * instead of direct EDI Platform integration with OAuth2.
 * 
 * Kept for reference in case we need to switch to direct integration later.
 */

/*
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  authUrl: string;
}

export interface OAuth2Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // Calculated expiry timestamp
}

export class OSDUOAuth2Client {
  private config: OAuth2Config;
  private cachedToken: OAuth2Token | null = null;

  constructor(config: OAuth2Config) {
    this.config = config;
  }

  /**
   * Get access token - uses cached token if valid, otherwise requests new one
   * Includes 5-minute buffer before expiry to prevent edge cases
   */
  async getAccessToken(): Promise<string> {
    // Check if cached token is still valid (with 5 min buffer)
    if (this.cachedToken && this.cachedToken.expires_at > Date.now() + 300000) {
      console.log('✅ Using cached OAuth2 token');
      return this.cachedToken.access_token;
    }

    console.log('🔄 Requesting new OAuth2 token from Amazon Federate');

    // Request new token using client credentials flow
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OAuth2 token request failed:', response.status, errorText);
      throw new Error(`OAuth2 authentication failed: ${response.status}`);
    }

    const tokenData = await response.json();
    
    // Cache token with calculated expiry
    this.cachedToken = {
      ...tokenData,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };

    console.log('✅ OAuth2 token acquired, expires in', tokenData.expires_in, 'seconds');
    return this.cachedToken.access_token;
  }

  /**
   * Clear cached token (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cachedToken = null;
    console.log('🗑️ OAuth2 token cache cleared');
  }
}
*/
