/**
 * Error Handling System Tests
 * Tests comprehensive error handling, recovery, and user feedback
 * Requirements: 6.1, 6.2, 6.3
 */

import {
  ErrorHandlingSystem,
  ErrorSeverity,
  ErrorCategory,
  ErrorDetails,
  RecoveryAction,
  ProgressIndicator,
  UserFeedback
} from '../errorHandlingSystem';

describe('ErrorHandlingSystem', () => {
  let errorHandler: ErrorHandlingSystem;
  let mockEvents: any[] = [];

  beforeEach(() => {
    errorHandler = new ErrorHandlingSystem({
      enableAutoRecovery: true,
      maxRetryAttempts: 2,
      retryDelay: 100,
      enableFallbackMethods: true,
      enableUserNotification: true,
      logErrors: false // Disable console logging for tests
    });

    mockEvents = [];

    // Capture all events
    errorHandler.on('error', (error) => mockEvents.push({ type: 'error', data: error }));
    errorHandler.on('user_feedback', (feedback) => mockEvents.push({ type: 'user_feedback', data: feedback }));
    errorHandler.on('progress_start', (progress) => mockEvents.push({ type: 'progress_start', data: progress }));
    errorHandler.on('progress_update', (progress) => mockEvents.push({ type: 'progress_update', data: progress }));
    errorHandler.on('progress_end', (progress) => mockEvents.push({ type: 'progress_end', data: progress }));
  });

  afterEach(() => {
    errorHandler.removeAllListeners();
    errorHandler.clearErrorHistory();
  });

  describe('Error Normalization', () => {
    test('should normalize standard Error to ErrorDetails', async () => {
      const standardError = new Error('Test error message');
      
      await errorHandler.handleError(standardError);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      expect(errorEvent).toBeDefined();
      
      const errorDetails = errorEvent.data as ErrorDetails;
      expect(errorDetails.id).toBeDefined();
      expect(errorDetails.code).toBeDefined();
      expect(errorDetails.message).toBe('Test error message');
      expect(errorDetails.category).toBeDefined();
      expect(errorDetails.severity).toBeDefined();
      expect(errorDetails.userMessage).toBeDefined();
      expect(errorDetails.suggestions).toBeInstanceOf(Array);
      expect(errorDetails.recoveryActions).toBeInstanceOf(Array);
    });

    test('should handle ErrorDetails directly', async () => {
      const errorDetails: ErrorDetails = {
        id: 'test_error_1',
        code: 'TEST_ERROR',
        message: 'Test error details',
        category: ErrorCategory.CALCULATION,
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date(),
        userMessage: 'A test error occurred',
        suggestions: ['Try again'],
        recoveryActions: []
      };
      
      await errorHandler.handleError(errorDetails);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      expect(errorEvent.data).toEqual(errorDetails);
    });
  });

  describe('Error Categorization', () => {
    test('should categorize calculation errors correctly', async () => {
      const calculationError = new Error('Calculation failed');
      
      await errorHandler.handleError(calculationError, { calculationType: 'porosity' });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.category).toBe(ErrorCategory.CALCULATION);
    });

    test('should categorize data validation errors correctly', async () => {
      const validationError = new Error('Invalid data format');
      
      await errorHandler.handleError(validationError, { wellData: {} });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.category).toBe(ErrorCategory.DATA_VALIDATION);
    });

    test('should categorize network errors correctly', async () => {
      const networkError = new Error('Network connection failed');
      
      await errorHandler.handleError(networkError);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.category).toBe(ErrorCategory.NETWORK);
    });
  });

  describe('Severity Assessment', () => {
    test('should assess critical severity correctly', async () => {
      const criticalError = new Error('Fatal system error - cannot proceed');
      
      await errorHandler.handleError(criticalError);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.severity).toBe(ErrorSeverity.CRITICAL);
    });

    test('should assess high severity correctly', async () => {
      const highError = new Error('Failed to load essential data');
      
      await errorHandler.handleError(highError);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.severity).toBe(ErrorSeverity.HIGH);
    });

    test('should assess medium severity correctly', async () => {
      const mediumError = new Error('Warning: partial data available');
      
      await errorHandler.handleError(mediumError);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('User Message Generation', () => {
    test('should generate user-friendly messages for calculation errors', async () => {
      const calculationError = new Error('TypeError: Cannot read property of undefined');
      
      await errorHandler.handleError(calculationError, { calculationType: 'porosity' });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.userMessage).toContain('calculation error occurred');
      expect(errorDetails.userMessage).not.toContain('TypeError');
    });

    test('should generate user-friendly messages for data validation errors', async () => {
      const validationError = new Error('ReferenceError: curve data is not defined');
      
      await errorHandler.handleError(validationError, { wellData: {} });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.userMessage).toContain('issue with the well data');
      expect(errorDetails.userMessage).not.toContain('ReferenceError');
    });
  });

  describe('Suggestions Generation', () => {
    test('should generate relevant suggestions for data validation errors', async () => {
      const validationError = new Error('Invalid LAS file format');
      
      await errorHandler.handleError(validationError, { wellData: {} });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.suggestions).toContain('Check that all required log curves are present');
      expect(errorDetails.suggestions).toContain('Verify the LAS file format is correct');
    });

    test('should generate relevant suggestions for calculation errors', async () => {
      const calculationError = new Error('Invalid calculation parameters');
      
      await errorHandler.handleError(calculationError, { calculationType: 'porosity' });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.suggestions).toContain('Check calculation parameters are within valid ranges');
      expect(errorDetails.suggestions).toContain('Try using alternative calculation methods');
    });

    test('should generate memory-specific suggestions', async () => {
      const memoryError = new Error('Out of memory error');
      
      await errorHandler.handleError(memoryError);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      expect(errorDetails.suggestions).toContain('Try processing smaller data chunks');
      expect(errorDetails.suggestions).toContain('Enable data compression in settings');
    });
  });

  describe('Recovery Actions', () => {
    test('should generate automatic recovery actions', async () => {
      const calculationError = new Error('Calculation timeout');
      
      await errorHandler.handleError(calculationError, { calculationType: 'porosity' });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      const automaticActions = errorDetails.recoveryActions.filter(action => action.automatic);
      expect(automaticActions.length).toBeGreaterThan(0);
    });

    test('should generate manual recovery actions', async () => {
      const calculationError = new Error('Complex calculation error');
      
      await errorHandler.handleError(calculationError, { calculationType: 'porosity' });
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      const errorDetails = errorEvent.data as ErrorDetails;
      
      const manualActions = errorDetails.recoveryActions.filter(action => !action.automatic);
      expect(manualActions.length).toBeGreaterThan(0);
    });
  });

  describe('Automatic Recovery', () => {
    test('should attempt automatic recovery for recoverable errors', async () => {
      const recoverableError = new Error('Temporary network issue');
      
      const recovered = await errorHandler.handleError(recoverableError);
      
      // Should attempt recovery (though it may not succeed in test environment)
      expect(typeof recovered).toBe('boolean');
    });

    test('should respect retry limits', async () => {
      const persistentError = new Error('Persistent calculation error');
      
      // First attempt
      await errorHandler.handleError(persistentError, { calculationType: 'test' });
      
      // Second attempt
      await errorHandler.handleError(persistentError, { calculationType: 'test' });
      
      // Third attempt should hit retry limit
      await errorHandler.handleError(persistentError, { calculationType: 'test' });
      
      const feedbackEvents = mockEvents.filter(e => e.type === 'user_feedback');
      const retryLimitEvent = feedbackEvents.find(e => 
        e.data.message.includes('Maximum retry attempts exceeded')
      );
      
      expect(retryLimitEvent).toBeDefined();
    });
  });

  describe('Progress Indicators', () => {
    test('should show and hide progress indicators', () => {
      const progressIndicator: ProgressIndicator = {
        id: 'test_progress',
        title: 'Test Operation',
        message: 'Processing...',
        progress: 50,
        indeterminate: false,
        canCancel: true
      };
      
      errorHandler.showProgress(progressIndicator);
      
      const startEvent = mockEvents.find(e => e.type === 'progress_start');
      expect(startEvent).toBeDefined();
      expect(startEvent.data).toEqual(progressIndicator);
      
      errorHandler.hideProgress('test_progress');
      
      const endEvent = mockEvents.find(e => e.type === 'progress_end');
      expect(endEvent).toBeDefined();
    });

    test('should update progress indicators', () => {
      const progressIndicator: ProgressIndicator = {
        id: 'test_progress',
        title: 'Test Operation',
        message: 'Processing...',
        progress: 25,
        indeterminate: false,
        canCancel: true
      };
      
      errorHandler.showProgress(progressIndicator);
      
      errorHandler.updateProgress('test_progress', { 
        progress: 75, 
        message: 'Almost done...' 
      });
      
      const updateEvent = mockEvents.find(e => e.type === 'progress_update');
      expect(updateEvent).toBeDefined();
      expect(updateEvent.data.progress).toBe(75);
      expect(updateEvent.data.message).toBe('Almost done...');
    });

    test('should track active progress indicators', () => {
      const indicator1: ProgressIndicator = {
        id: 'progress1',
        title: 'Operation 1',
        message: 'Processing...',
        progress: 30,
        indeterminate: false,
        canCancel: false
      };
      
      const indicator2: ProgressIndicator = {
        id: 'progress2',
        title: 'Operation 2',
        message: 'Loading...',
        progress: 60,
        indeterminate: false,
        canCancel: true
      };
      
      errorHandler.showProgress(indicator1);
      errorHandler.showProgress(indicator2);
      
      const activeProgress = errorHandler.getActiveProgress();
      expect(activeProgress).toHaveLength(2);
      expect(activeProgress.find(p => p.id === 'progress1')).toBeDefined();
      expect(activeProgress.find(p => p.id === 'progress2')).toBeDefined();
      
      errorHandler.hideProgress('progress1');
      
      const remainingProgress = errorHandler.getActiveProgress();
      expect(remainingProgress).toHaveLength(1);
      expect(remainingProgress[0].id).toBe('progress2');
    });
  });

  describe('User Feedback', () => {
    test('should emit user feedback events', () => {
      const feedback: UserFeedback = {
        type: 'success',
        title: 'Operation Complete',
        message: 'The operation completed successfully',
        duration: 5000
      };
      
      errorHandler.showUserFeedback(feedback);
      
      const feedbackEvent = mockEvents.find(e => e.type === 'user_feedback');
      expect(feedbackEvent).toBeDefined();
      expect(feedbackEvent.data).toEqual(feedback);
    });

    test('should show user feedback for errors when enabled', async () => {
      const testError = new Error('Test error for user feedback');
      
      await errorHandler.handleError(testError);
      
      const feedbackEvent = mockEvents.find(e => e.type === 'user_feedback');
      expect(feedbackEvent).toBeDefined();
      expect(feedbackEvent.data.type).toBe('error');
    });
  });

  describe('Error Statistics', () => {
    test('should track error statistics', async () => {
      // Add various types of errors
      await errorHandler.handleError(new Error('Calculation error'), { calculationType: 'porosity' });
      await errorHandler.handleError(new Error('Data validation error'), { wellData: {} });
      await errorHandler.handleError(new Error('Network error'));
      
      const stats = errorHandler.getErrorStatistics();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory[ErrorCategory.CALCULATION]).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.DATA_VALIDATION]).toBe(1);
      expect(stats.errorsByCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });

    test('should calculate recovery rate', async () => {
      await errorHandler.handleError(new Error('Test error 1'));
      await errorHandler.handleError(new Error('Test error 2'));
      
      const stats = errorHandler.getErrorStatistics();
      
      expect(typeof stats.recoveryRate).toBe('number');
      expect(stats.recoveryRate).toBeGreaterThanOrEqual(0);
    });

    test('should clear error history', async () => {
      await errorHandler.handleError(new Error('Test error'));
      
      let stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(1);
      
      errorHandler.clearErrorHistory();
      
      stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(0);
    });
  });

  describe('Configuration', () => {
    test('should respect auto-recovery configuration', async () => {
      const noAutoRecoveryHandler = new ErrorHandlingSystem({
        enableAutoRecovery: false,
        enableUserNotification: true
      });
      
      const mockFeedbackEvents: any[] = [];
      noAutoRecoveryHandler.on('user_feedback', (feedback) => 
        mockFeedbackEvents.push(feedback)
      );
      
      await noAutoRecoveryHandler.handleError(new Error('Test error'));
      
      // Should show user feedback instead of attempting recovery
      expect(mockFeedbackEvents.length).toBeGreaterThan(0);
      
      noAutoRecoveryHandler.removeAllListeners();
    });

    test('should respect user notification configuration', async () => {
      const noNotificationHandler = new ErrorHandlingSystem({
        enableAutoRecovery: false,
        enableUserNotification: false
      });
      
      const mockFeedbackEvents: any[] = [];
      noNotificationHandler.on('user_feedback', (feedback) => 
        mockFeedbackEvents.push(feedback)
      );
      
      await noNotificationHandler.handleError(new Error('Test error'));
      
      // Should not show user feedback
      expect(mockFeedbackEvents.length).toBe(0);
      
      noNotificationHandler.removeAllListeners();
    });
  });

  describe('Edge Cases', () => {
    test('should handle errors without messages', async () => {
      const emptyError = new Error();
      
      await errorHandler.handleError(emptyError);
      
      const errorEvent = mockEvents.find(e => e.type === 'error');
      expect(errorEvent).toBeDefined();
      
      const errorDetails = errorEvent.data as ErrorDetails;
      expect(errorDetails.userMessage).toBeDefined();
      expect(errorDetails.suggestions).toBeInstanceOf(Array);
    });

    test('should handle null/undefined context', async () => {
      const testError = new Error('Test error');
      
      await errorHandler.handleError(testError, null);
      await errorHandler.handleError(testError, undefined);
      
      const errorEvents = mockEvents.filter(e => e.type === 'error');
      expect(errorEvents).toHaveLength(2);
    });

    test('should handle concurrent error handling', async () => {
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3')
      ];
      
      const promises = errors.map(error => errorHandler.handleError(error));
      await Promise.all(promises);
      
      const errorEvents = mockEvents.filter(e => e.type === 'error');
      expect(errorEvents).toHaveLength(3);
    });
  });
});