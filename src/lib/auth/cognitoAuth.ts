/**
 * Cognito Authentication Provider
 * 
 * Handles authentication with AWS Cognito User Pool
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

export class CognitoAuthProvider {
  private userPool: CognitoUserPool;
  private currentSession: CognitoUserSession | null = null;

  constructor() {
    this.userPool = new CognitoUserPool(COGNITO_CONFIG);
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
   * Requires valid Cognito session
   */
  async getToken(): Promise<string> {
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
      this.currentSession = null;
      console.log('✅ Cognito Auth: Signed out');
    }
  }

  /**
   * Check if user is authenticated
   * Returns false if no valid Cognito session exists
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getSession();
      return session.isValid();
    } catch {
      return false;
    }
  }

  /**
   * Get current user info
   * Throws error if no valid Cognito session exists
   */
  async getUserInfo() {
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
