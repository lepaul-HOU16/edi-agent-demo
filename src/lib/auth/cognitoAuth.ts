/**
 * Cognito Authentication Provider
 * 
 * Handles authentication with AWS Cognito User Pool
 * Supports mock authentication for development
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

const COGNITO_CONFIG = {
  UserPoolId: 'us-east-1_sC6yswGji',
  ClientId: '18m99t0u39vi9614ssd8sf8vmb',
};

// Enable mock auth in development mode
const ENABLE_MOCK_AUTH = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

export class CognitoAuthProvider {
  private userPool: CognitoUserPool;
  private currentUser: CognitoUser | null = null;
  private currentSession: CognitoUserSession | null = null;

  constructor() {
    this.userPool = new CognitoUserPool(COGNITO_CONFIG);
    this.currentUser = this.userPool.getCurrentUser();
    
    if (ENABLE_MOCK_AUTH) {
      console.log('🔓 Mock Auth: Development mode enabled');
    }
  }

  /**
   * Get current authenticated session
   */
  async getSession(): Promise<CognitoUserSession> {
    if (this.currentSession && this.currentSession.isValid()) {
      return this.currentSession;
    }

    return new Promise((resolve, reject) => {
      const user = this.userPool.getCurrentUser();
      
      if (!user) {
        reject(new Error('No authenticated user'));
        return;
      }

      user.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
          return;
        }

        if (!session || !session.isValid()) {
          reject(new Error('Invalid session'));
          return;
        }

        this.currentSession = session;
        resolve(session);
      });
    });
  }

  /**
   * Get JWT ID token for API authentication
   * In development mode, returns mock token if Cognito auth fails
   */
  async getToken(): Promise<string> {
    // In development mode, use mock token
    if (ENABLE_MOCK_AUTH) {
      try {
        const session = await this.getSession();
        const idToken = session.getIdToken().getJwtToken();
        console.log('🔐 Cognito Auth: Retrieved valid token');
        return idToken;
      } catch (error) {
        // Fall back to consistent mock token in development
        const mockToken = 'mock-dev-token-test-user';
        console.log('🔓 Mock Auth: Using mock token for development');
        return mockToken;
      }
    }
    
    // In production, require real Cognito token
    try {
      const session = await this.getSession();
      const idToken = session.getIdToken().getJwtToken();
      console.log('🔐 Cognito Auth: Retrieved valid token');
      return idToken;
    } catch (error) {
      console.error('❌ Cognito Auth: Failed to get token', error);
      throw new Error('Authentication required. Please sign in.');
    }
  }

  /**
   * Sign in with username and password
   */
  async signIn(username: string, password: string): Promise<CognitoUserSession> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          this.currentUser = cognitoUser;
          this.currentSession = session;
          console.log('✅ Cognito Auth: Sign in successful');
          resolve(session);
        },
        onFailure: (err) => {
          console.error('❌ Cognito Auth: Sign in failed', err);
          reject(err);
        },
      });
    });
  }

  /**
   * Sign out current user
   */
  signOut(): void {
    const user = this.userPool.getCurrentUser();
    if (user) {
      user.signOut();
      this.currentUser = null;
      this.currentSession = null;
      console.log('✅ Cognito Auth: Signed out');
    }
  }

  /**
   * Check if user is authenticated
   * In development mode with mock auth, always returns true
   */
  async isAuthenticated(): Promise<boolean> {
    if (ENABLE_MOCK_AUTH) {
      try {
        const session = await this.getSession();
        return session.isValid();
      } catch {
        // In development, consider mock auth as authenticated
        console.log('🔓 Mock Auth: Treating as authenticated in development mode');
        return true;
      }
    }
    
    try {
      const session = await this.getSession();
      return session.isValid();
    } catch {
      return false;
    }
  }

  /**
   * Get current user info
   * In development mode with mock auth, returns mock user info
   */
  async getUserInfo() {
    if (ENABLE_MOCK_AUTH) {
      try {
        const session = await this.getSession();
        const idToken = session.getIdToken();
        const payload = idToken.payload;

        return {
          userId: payload.sub,
          username: payload['cognito:username'],
          email: payload.email,
        };
      } catch {
        // Return mock user info in development
        console.log('🔓 Mock Auth: Using mock user info');
        return {
          userId: 'mock-user-id',
          username: 'mock-user',
          email: 'mock@example.com',
        };
      }
    }
    
    const session = await this.getSession();
    const idToken = session.getIdToken();
    const payload = idToken.payload;

    return {
      userId: payload.sub,
      username: payload['cognito:username'],
      email: payload.email,
    };
  }
}

// Export singleton instance
export const cognitoAuth = new CognitoAuthProvider();
