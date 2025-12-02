/**
 * Property-Based Testing Generators for Speech Recognition
 * 
 * Fast-check generators for creating random test data for
 * property-based testing of the push-to-talk voice input feature.
 */

import fc from 'fast-check';
import { SpeechRecognitionErrorType } from '../../types/speechRecognition';

/**
 * Generator for valid transcription text
 * Generates realistic speech transcription strings
 */
export const transcriptionArbitrary = fc.string({
  minLength: 1,
  maxLength: 500
}).filter(s => s.trim().length > 0);

/**
 * Generator for whitespace-only strings
 * Used to test empty submission prevention
 */
export const whitespaceOnlyArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant(' '),
  fc.constant('  '),
  fc.constant('\t'),
  fc.constant('\n'),
  fc.constant('   \t  \n  ')
);

/**
 * Generator for interim transcription results
 * Generates sequences of partial transcriptions
 */
export const interimResultsArbitrary = fc.array(
  fc.string({ minLength: 1, maxLength: 100 }),
  { minLength: 1, maxLength: 20 }
);

/**
 * Generator for final transcription results
 * Generates sequences of complete transcriptions
 */
export const finalResultsArbitrary = fc.array(
  fc.string({ minLength: 1, maxLength: 50 }),
  { minLength: 1, maxLength: 10 }
);

/**
 * Generator for confidence scores
 * Generates values between 0 and 1
 */
export const confidenceArbitrary = fc.double({ min: 0, max: 1 });

/**
 * Generator for speech recognition error types
 */
export const errorTypeArbitrary = fc.constantFrom<SpeechRecognitionErrorType>(
  'no-speech',
  'aborted',
  'audio-capture',
  'network',
  'not-allowed',
  'service-not-allowed',
  'bad-grammar',
  'language-not-supported'
);

/**
 * Generator for language codes
 */
export const languageCodeArbitrary = fc.constantFrom(
  'en-US',
  'en-GB',
  'es-ES',
  'fr-FR',
  'de-DE',
  'it-IT',
  'pt-BR',
  'ja-JP',
  'zh-CN'
);

/**
 * Generator for boolean values (for testing state transitions)
 */
export const booleanArbitrary = fc.boolean();

/**
 * Generator for timestamps
 */
export const timestampArbitrary = fc.integer({ min: 0, max: Date.now() });

/**
 * Generator for permission states
 */
export const permissionStateArbitrary = fc.constantFrom(
  'granted',
  'denied',
  'prompt',
  null
);

/**
 * Generator for recording states
 */
export const recordingStateArbitrary = fc.constantFrom(
  'idle',
  'requesting-permission',
  'recording',
  'processing',
  'error'
);

/**
 * Generator for speech recognition configuration
 */
export const speechRecognitionConfigArbitrary = fc.record({
  continuous: fc.boolean(),
  interimResults: fc.boolean(),
  lang: languageCodeArbitrary,
  maxAlternatives: fc.integer({ min: 1, max: 5 })
});

/**
 * Generator for transcription state
 */
export const transcriptionStateArbitrary = fc.record({
  interim: fc.string({ maxLength: 200 }),
  final: fc.string({ maxLength: 500 }),
  confidence: confidenceArbitrary
});

/**
 * Generator for PTT button state
 */
export const pttStateArbitrary = fc.record({
  isRecording: fc.boolean(),
  isProcessing: fc.boolean(),
  hasError: fc.boolean(),
  errorMessage: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  permissionStatus: permissionStateArbitrary
});

/**
 * Generator for error state
 */
export const errorStateArbitrary = fc.record({
  hasError: fc.boolean(),
  errorType: fc.option(errorTypeArbitrary, { nil: null }),
  errorMessage: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  timestamp: timestampArbitrary,
  canRetry: fc.boolean()
});

/**
 * Generator for sequences of speech events
 * Useful for testing complex interaction flows
 */
export const speechEventSequenceArbitrary = fc.array(
  fc.oneof(
    fc.record({ type: fc.constant('start' as const) }),
    fc.record({ 
      type: fc.constant('interim' as const),
      transcript: transcriptionArbitrary,
      confidence: confidenceArbitrary
    }),
    fc.record({ 
      type: fc.constant('final' as const),
      transcript: transcriptionArbitrary,
      confidence: confidenceArbitrary
    }),
    fc.record({ 
      type: fc.constant('error' as const),
      errorType: errorTypeArbitrary
    }),
    fc.record({ type: fc.constant('end' as const) })
  ),
  { minLength: 1, maxLength: 20 }
);

/**
 * Generator for user interaction sequences
 * Simulates press/release patterns
 */
export const userInteractionArbitrary = fc.array(
  fc.record({
    action: fc.constantFrom('press', 'release'),
    timestamp: timestampArbitrary,
    key: fc.option(fc.constantFrom('Space', 'Enter', 'mouse'), { nil: null })
  }),
  { minLength: 2, maxLength: 10 }
).filter(interactions => {
  // Ensure interactions alternate between press and release
  let expectedAction: 'press' | 'release' = 'press';
  for (const interaction of interactions) {
    if (interaction.action !== expectedAction) {
      return false;
    }
    expectedAction = expectedAction === 'press' ? 'release' : 'press';
  }
  return expectedAction === 'press'; // Should end with release
});

/**
 * Generator for realistic speech transcription with pauses
 * Simulates natural speech patterns
 */
export const naturalSpeechArbitrary = fc.array(
  fc.record({
    text: fc.string({ minLength: 1, maxLength: 50 }),
    pauseDuration: fc.integer({ min: 0, max: 3000 }) // milliseconds
  }),
  { minLength: 1, maxLength: 10 }
);

/**
 * Generator for edge case transcriptions
 * Tests handling of special characters, numbers, etc.
 */
export const edgeCaseTranscriptionArbitrary = fc.oneof(
  fc.constant(''),
  fc.constant(' '),
  fc.constant('123'),
  fc.constant('!@#$%^&*()'),
  fc.constant('Hello\nWorld'),
  fc.constant('   leading spaces'),
  fc.constant('trailing spaces   '),
  fc.constant('multiple   spaces'),
  fc.string({ minLength: 1000, maxLength: 2000 }), // Very long
  fc.unicodeString({ minLength: 1, maxLength: 100 }) // Unicode characters
);

/**
 * Configuration for property-based tests
 * Ensures all tests run with consistent settings
 */
export const propertyTestConfig = {
  numRuns: 100, // Minimum 100 iterations as per design doc
  verbose: false,
  seed: undefined, // Can be set for reproducible tests
  path: undefined,
  endOnFailure: false
};

/**
 * Helper function to run a property test with standard configuration
 */
export function runPropertyTest<T>(
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => boolean | void,
  config: Partial<typeof propertyTestConfig> = {}
): void {
  fc.assert(
    fc.property(arbitrary, predicate),
    { ...propertyTestConfig, ...config }
  );
}
