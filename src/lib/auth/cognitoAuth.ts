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
  CognitoUserAttribute,
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

  /**
   * Register new user with username, email, and password
   * Creates user in Cognito User Pool and sends verification email
   */
  async signUp(username: string, email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ];

      this.userPool.signUp(
        username,
        password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            console.error('❌ Cognito Auth: Sign up failed', err);
            reject(this.mapCognitoError(err));
            return;
          }

          console.log('✅ Cognito Auth: Sign up successful', {
            username,
            userConfirmed: result?.userConfirmed,
          });
          resolve();
        }
      );
    });
  }

  /**
   * Confirm user email with verification code
   * Verifies the code sent to user's email during sign-up
   */
  async confirmSignUp(username: string, code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('❌ Cognito Auth: Email verification failed', err);
          reject(this.mapCognitoError(err));
          return;
        }

        console.log('✅ Cognito Auth: Email verified successfully', result);
        resolve();
      });
    });
  }

  /**
   * Resend verification code to user's email
   * Useful when user didn't receive the original code
   */
  async resendConfirmationCode(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool,
      });

      cognitoUser.resendConfirmationCode((err, result) => {
        if (err) {
          console.error('❌ Cognito Auth: Resend code failed', err);
          reject(this.mapCognitoError(err));
          return;
        }

        console.log('✅ Cognito Auth: Verification code resent', result);
        resolve();
      });
    });
  }

  /**
   * Map Cognito error codes to user-friendly error messages
   */
  private mapCognitoError(error: any): Error {
    const errorCode = error.code || error.name;
    const errorMessages: Record<string, string> = {
      'UsernameExistsException': 'Username already taken. Please choose another.',
      'InvalidParameterException': 'Invalid input. Please check your information.',
      'InvalidPasswordException': 'Password does not meet requirements.',
      'CodeMismatchException': 'Invalid verification code. Please try again.',
      'ExpiredCodeException': 'Verification code expired. Please request a new one.',
      'LimitExceededException': 'Too many attempts. Please try again later.',
      'UserNotFoundException': 'User not found. Please sign up first.',
      'NotAuthorizedException': 'Invalid verification code.',
      'TooManyRequestsException': 'Too many requests. Please wait a moment and try again.',
      'TooManyFailedAttemptsException': 'Too many failed attempts. Please try again later.',
    };

    const message = errorMessages[errorCode] || error.message || 'An error occurred. Please try again.';
    const mappedError = new Error(message);
    (mappedError as any).code = errorCode;
    return mappedError;
  }
}

// Export singleton instance
export const cognitoAuth = new CognitoAuthProvider();
