/**
 * Speech Recognition Test Setup
 * 
 * Common setup and utilities for testing speech recognition components.
 * Import this in test files to get consistent test environment.
 */

import { 
  MockSpeechRecognition,
  setupSpeechRecognitionMock,
  cleanupSpeechRecognitionMock
} from './speechRecognitionMock';

/**
 * Global mock instance
 * Available to all tests after setup
 */
let mockSpeechRecognition: MockSpeechRecognition | null = null;

/**
 * Setup function to call before each test
 * Initializes the mock SpeechRecognition API
 */
export function setupSpeechRecognitionTests(): MockSpeechRecognition {
  mockSpeechRecognition = setupSpeechRecognitionMock();
  return mockSpeechRecognition;
}

/**
 * Cleanup function to call after each test
 * Removes the mock and resets state
 */
export function cleanupSpeechRecognitionTests(): void {
  if (mockSpeechRecognition) {
    mockSpeechRecognition.reset();
    mockSpeechRecognition = null;
  }
  cleanupSpeechRecognitionMock();
}

/**
 * Get the current mock instance
 * Throws if setup hasn't been called
 */
export function getMockSpeechRecognition(): MockSpeechRecognition {
  if (!mockSpeechRecognition) {
    throw new Error('Mock SpeechRecognition not initialized. Call setupSpeechRecognitionTests() first.');
  }
  return mockSpeechRecognition;
}

/**
 * Helper to simulate a complete recording session
 * Useful for integration tests
 */
export async function simulateRecordingSession(
  mock: MockSpeechRecognition,
  transcripts: Array<{ text: string; isFinal: boolean; confidence?: number }>,
  delayMs: number = 10
): Promise<void> {
  // Start recording
  mock.start();
  await delay(delayMs);

  // Emit audio start
  mock.emitAudioStart();
  await delay(delayMs);

  // Emit speech start
  mock.emitSpeechStart();
  await delay(delayMs);

  // Emit transcripts
  for (const transcript of transcripts) {
    mock.emitResult(transcript.text, transcript.isFinal, transcript.confidence ?? 1.0);
    await delay(delayMs);
  }

  // Emit speech end
  mock.emitSpeechEnd();
  await delay(delayMs);

  // Emit audio end
  mock.emitAudioEnd();
  await delay(delayMs);

  // Stop recording
  mock.stop();
  await delay(delayMs);
}

/**
 * Helper to simulate an error during recording
 */
export async function simulateRecordingError(
  mock: MockSpeechRecognition,
  errorType: string,
  delayMs: number = 10
): Promise<void> {
  // Start recording
  mock.start();
  await delay(delayMs);

  // Emit error
  mock.emitError(errorType as any);
  await delay(delayMs);

  // Stop recording
  mock.stop();
  await delay(delayMs);
}

/**
 * Helper to simulate permission denial
 */
export async function simulatePermissionDenied(
  mock: MockSpeechRecognition,
  delayMs: number = 10
): Promise<void> {
  await simulateRecordingError(mock, 'not-allowed', delayMs);
}

/**
 * Helper to simulate network error
 */
export async function simulateNetworkError(
  mock: MockSpeechRecognition,
  delayMs: number = 10
): Promise<void> {
  await simulateRecordingError(mock, 'network', delayMs);
}

/**
 * Helper to simulate no speech detected
 */
export async function simulateNoSpeech(
  mock: MockSpeechRecognition,
  delayMs: number = 10
): Promise<void> {
  await simulateRecordingError(mock, 'no-speech', delayMs);
}

/**
 * Delay helper for async tests
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 * Useful for waiting for state updates
 */
export async function waitFor(
  condition: () => boolean,
  timeoutMs: number = 1000,
  intervalMs: number = 10
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Timeout waiting for condition');
    }
    await delay(intervalMs);
  }
}

/**
 * Mock microphone permissions API
 */
export function mockMediaDevices(): void {
  if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        })
      }
    });
  }
}

/**
 * Mock permissions API
 */
export function mockPermissionsAPI(state: 'granted' | 'denied' | 'prompt' = 'granted'): void {
  if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'permissions', {
      writable: true,
      value: {
        query: jest.fn().mockResolvedValue({ state })
      }
    });
  }
}

/**
 * Create a mock event listener tracker
 * Useful for verifying event handlers are called
 */
export function createEventListenerTracker() {
  const calls: Array<{ event: string; data: any }> = [];
  
  return {
    track: (event: string, data?: any) => {
      calls.push({ event, data });
    },
    getCalls: () => calls,
    getCallsForEvent: (event: string) => calls.filter(c => c.event === event),
    reset: () => {
      calls.length = 0;
    },
    hasEvent: (event: string) => calls.some(c => c.event === event),
    getCallCount: (event?: string) => 
      event ? calls.filter(c => c.event === event).length : calls.length
  };
}

/**
 * Test data generators
 */
export const testData = {
  /**
   * Generate a random transcription
   */
  randomTranscription: (length: number = 50): string => {
    const words = ['hello', 'world', 'test', 'speech', 'recognition', 'voice', 'input'];
    const result: string[] = [];
    for (let i = 0; i < length; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }
    return result.join(' ');
  },

  /**
   * Generate a sequence of interim results
   */
  interimSequence: (finalText: string): Array<{ text: string; isFinal: boolean }> => {
    const words = finalText.split(' ');
    const sequence: Array<{ text: string; isFinal: boolean }> = [];
    
    // Add interim results (building up the text)
    for (let i = 1; i <= words.length; i++) {
      sequence.push({
        text: words.slice(0, i).join(' '),
        isFinal: false
      });
    }
    
    // Add final result
    sequence.push({
      text: finalText,
      isFinal: true
    });
    
    return sequence;
  },

  /**
   * Generate whitespace-only strings
   */
  whitespaceStrings: [
    '',
    ' ',
    '  ',
    '\t',
    '\n',
    '   \t  \n  ',
    '     '
  ]
};

/**
 * Assertion helpers
 */
export const assertions = {
  /**
   * Assert that a string is not empty or whitespace-only
   */
  assertNotEmpty: (value: string): void => {
    expect(value.trim()).not.toBe('');
  },

  /**
   * Assert that a value is within a range
   */
  assertInRange: (value: number, min: number, max: number): void => {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  },

  /**
   * Assert that an event was called
   */
  assertEventCalled: (mock: jest.Mock, eventName: string): void => {
    expect(mock).toHaveBeenCalled();
    const calls = mock.mock.calls;
    const eventCall = calls.find(call => call[0]?.type === eventName);
    expect(eventCall).toBeDefined();
  }
};
