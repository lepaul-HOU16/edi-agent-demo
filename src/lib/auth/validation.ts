/**
 * Input validation utilities for user registration
 * Requirements: 2.1, 2.2, 9.1, 9.2, 10.1, 10.2
 */

// Validation error messages
export const VALIDATION_ERRORS = {
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters',
  USERNAME_INVALID_CHARS: 'Username can only contain letters, numbers, and underscores',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  PASSWORD_MISSING_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_MISSING_LOWERCASE: 'Password must contain at least one lowercase letter',
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number',
  PASSWORD_MISSING_SPECIAL: 'Password must contain at least one special character',
  PASSWORD_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
} as const;

// Validation rules
const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    minLength: 8,
    uppercasePattern: /[A-Z]/,
    lowercasePattern: /[a-z]/,
    numberPattern: /[0-9]/,
    specialPattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  },
};

/**
 * Validate username format and length
 * Requirements: 10.1, 10.2
 */
export function validateUsername(username: string): string | null {
  if (!username || username.length < VALIDATION_RULES.username.minLength) {
    return VALIDATION_ERRORS.USERNAME_TOO_SHORT;
  }

  if (!VALIDATION_RULES.username.pattern.test(username)) {
    return VALIDATION_ERRORS.USERNAME_INVALID_CHARS;
  }

  return null;
}

/**
 * Validate email format
 * Requirements: 9.1, 9.2
 */
export function validateEmail(email: string): string | null {
  if (!email || !VALIDATION_RULES.email.pattern.test(email)) {
    return VALIDATION_ERRORS.EMAIL_INVALID;
  }

  return null;
}

/**
 * Validate password strength requirements
 * Requirements: 2.1, 2.2
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < VALIDATION_RULES.password.minLength) {
    return VALIDATION_ERRORS.PASSWORD_TOO_SHORT;
  }

  if (!VALIDATION_RULES.password.uppercasePattern.test(password)) {
    return VALIDATION_ERRORS.PASSWORD_MISSING_UPPERCASE;
  }

  if (!VALIDATION_RULES.password.lowercasePattern.test(password)) {
    return VALIDATION_ERRORS.PASSWORD_MISSING_LOWERCASE;
  }

  if (!VALIDATION_RULES.password.numberPattern.test(password)) {
    return VALIDATION_ERRORS.PASSWORD_MISSING_NUMBER;
  }

  if (!VALIDATION_RULES.password.specialPattern.test(password)) {
    return VALIDATION_ERRORS.PASSWORD_MISSING_SPECIAL;
  }

  return null;
}

/**
 * Validate that passwords match
 * Requirements: 2.3, 2.4
 */
export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return VALIDATION_ERRORS.PASSWORDS_DONT_MATCH;
  }

  return null;
}

/**
 * Validate all sign-up form fields
 * Returns an object with validation errors for each field
 */
export interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function validateSignUpForm(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationErrors {
  const errors: ValidationErrors = {};

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const passwordMatchError = validatePasswordMatch(password, confirmPassword);
  if (passwordMatchError) errors.confirmPassword = passwordMatchError;

  return errors;
}

/**
 * Check if form has any validation errors
 */
export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
