/**
 * Speech Recognition Type Definitions
 * 
 * TypeScript interfaces for the Web Speech API and related types
 * for the push-to-talk voice input feature.
 */

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

/**
 * Speech Recognition Configuration
 * Settings for initializing the Web Speech API
 */
export interface SpeechRecognitionConfig {
  /** Whether to continue listening after the first result */
  continuous: boolean;
  /** Whether to return interim results as they are recognized */
  interimResults: boolean;
  /** Language code for recognition (e.g., 'en-US') */
  lang: string;
  /** Maximum number of alternative transcriptions to return */
  maxAlternatives: number;
}

/**
 * Transcription State
 * Represents the current state of speech transcription
 */
export interface TranscriptionState {
  /** Interim (partial) transcription text */
  interim: string;
  /** Final (complete) transcription text */
  final: string;
  /** Confidence score of the transcription (0-1) */
  confidence: number;
}

/**
 * Speech Recognition Error Types
 * All possible error types from the Web Speech API
 */
export type SpeechRecognitionErrorType =
  | 'no-speech'              // No speech detected
  | 'aborted'                // Recognition aborted
  | 'audio-capture'          // Microphone hardware issue
  | 'network'                // Network error during recognition
  | 'not-allowed'            // Permissions denied
  | 'service-not-allowed'    // Service not available
  | 'bad-grammar'            // Grammar error (rare)
  | 'language-not-supported'; // Language not supported

/**
 * Speech Recognition Error
 * Structured error information with user-friendly messages
 */
export interface SpeechRecognitionError {
  /** Technical error type */
  type: SpeechRecognitionErrorType;
  /** Technical error message */
  message: string;
  /** User-friendly error message */
  userMessage: string;
}

/**
 * Error Message Mappings
 * Maps technical error types to user-friendly messages with recovery instructions
 */
export const ERROR_MESSAGES: Record<SpeechRecognitionErrorType, string> = {
  'no-speech': 'No speech detected. Please try again and speak clearly into your microphone.',
  'audio-capture': 'Microphone not accessible. Please check that your microphone is connected and not being used by another application.',
  'aborted': 'Recording was interrupted. Please try again.',
  'network': 'Network error occurred. Please check your internet connection and try again.',
  'not-allowed': 'Microphone access denied. Please click the microphone icon in your browser\'s address bar and allow microphone access, then try again.',
  'service-not-allowed': 'Speech recognition service unavailable. This may be due to browser restrictions. Please ensure you\'re using HTTPS and try again later.',
  'bad-grammar': 'Speech recognition error. Please try again.',
  'language-not-supported': 'Language not supported. Please check your browser settings or try a different browser.'
};

/**
 * PTT Button State
 * Represents the state of the push-to-talk button
 */
export interface PTTState {
  /** Whether recording is currently active */
  isRecording: boolean;
  /** Whether transcription is being processed */
  isProcessing: boolean;
  /** Whether an error has occurred */
  hasError: boolean;
  /** Current error message (null if no error) */
  errorMessage: string | null;
  /** Microphone permission status */
  permissionStatus: 'granted' | 'denied' | 'prompt' | null;
}

/**
 * Transcription Display State
 * Represents the state of the transcription display component
 */
export interface TranscriptionDisplayState {
  /** Current transcription text */
  text: string;
  /** Whether this is an interim (partial) result */
  isInterim: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Timestamp when transcription was received */
  timestamp: number;
}

/**
 * Speech Recognition Event
 * Event fired when speech recognition produces results
 */
export interface SpeechRecognitionEvent {
  /** List of recognition results */
  results: SpeechRecognitionResultList;
  /** Index of the first new result */
  resultIndex: number;
}

/**
 * Speech Recognition Error Event
 * Event fired when speech recognition encounters an error
 */
export interface SpeechRecognitionErrorEvent {
  /** Error type */
  error: SpeechRecognitionErrorType;
  /** Error message */
  message: string;
}

/**
 * Error State
 * Complete error state management
 */
export interface ErrorState {
  /** Whether an error is currently active */
  hasError: boolean;
  /** Type of error (null if no error) */
  errorType: SpeechRecognitionErrorType | null;
  /** User-friendly error message (null if no error) */
  errorMessage: string | null;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Whether the user can retry after this error */
  canRetry: boolean;
}

/**
 * Permission State
 * Microphone permission status
 */
export type PermissionState = 'granted' | 'denied' | 'prompt' | null;

/**
 * Recording State
 * Current state of the recording process
 */
export type RecordingState = 'idle' | 'requesting-permission' | 'recording' | 'processing' | 'error';
