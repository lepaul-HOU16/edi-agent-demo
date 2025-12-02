/**
 * PushToTalkButton Component
 * 
 * A button component that enables voice input through the Web Speech API.
 * Users press and hold the button to record speech, which is transcribed in real-time.
 * 
 * Features:
 * - Browser support detection (Chrome, Edge, Safari)
 * - Press-and-hold interaction (mouse and keyboard)
 * - Real-time speech transcription
 * - Error handling and permissions management
 * - Accessibility support (ARIA labels, keyboard navigation)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Button } from '@cloudscape-design/components';
import {
  SpeechRecognitionConfig,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionErrorType,
  ERROR_MESSAGES,
  ErrorState,
  PermissionState,
  RecordingState
} from '../types/speechRecognition';
import './PushToTalkButton.css';

/**
 * Props for PushToTalkButton component
 */
export interface PushToTalkButtonProps {
  /** Callback when transcription is complete and ready to submit */
  onTranscriptionComplete: (text: string) => void;
  /** Optional callback for real-time transcription updates */
  onTranscriptionChange?: (text: string) => void;
  /** Optional callback for recording state changes */
  onRecordingStateChange?: (isRecording: boolean) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Detects if the Web Speech API is supported in the current browser
 * 
 * @returns The SpeechRecognition constructor if supported, null otherwise
 */
const detectSpeechRecognitionSupport = (): typeof SpeechRecognition | null => {
  // Check for standard SpeechRecognition API
  if ('SpeechRecognition' in window) {
    return window.SpeechRecognition;
  }
  
  // Check for webkit-prefixed API (Chrome, Edge, Safari)
  if ('webkitSpeechRecognition' in window) {
    return window.webkitSpeechRecognition;
  }
  
  // No support found
  return null;
};

/**
 * Get enhanced error message with browser-specific recovery instructions
 * 
 * @param errorType - The type of speech recognition error
 * @returns Enhanced error message with recovery instructions
 */
const getEnhancedErrorMessage = (errorType: SpeechRecognitionErrorType): string => {
  const baseMessage = ERROR_MESSAGES[errorType] || 'An error occurred. Please try again.';
  
  // Add browser-specific instructions for permission errors
  if (errorType === 'not-allowed') {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    if (isChrome) {
      return `${baseMessage} In Chrome, click the camera/microphone icon in the address bar.`;
    } else if (isSafari) {
      return `${baseMessage} In Safari, go to Safari > Settings for This Website and allow microphone access.`;
    } else if (isFirefox) {
      return `${baseMessage} In Firefox, click the microphone icon in the address bar.`;
    }
  }
  
  return baseMessage;
};

/**
 * PushToTalkButton Component
 * 
 * Provides voice input functionality through press-and-hold interaction.
 * Returns null if browser doesn't support Web Speech API.
 */
export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  onTranscriptionComplete,
  onTranscriptionChange,
  onRecordingStateChange,
  disabled = false,
  className = ''
}) => {
  // Browser support detection
  const SpeechRecognitionAPI = useRef<typeof SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  
  // Speech recognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Component state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>(null);
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    errorType: null,
    errorMessage: null,
    timestamp: 0,
    canRetry: true
  });
  
  // Transcription state
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  
  // Track if button is currently pressed
  const isPressedRef = useRef<boolean>(false);
  
  // Track focus state for tooltip
  const [isFocused, setIsFocused] = useState<boolean>(false);
  
  // Track pressed state for immediate visual feedback
  const [isPressed, setIsPressed] = useState<boolean>(false);
  
  /**
   * Initialize browser support detection and load persisted permission state on mount
   */
  useEffect(() => {
    const api = detectSpeechRecognitionSupport();
    SpeechRecognitionAPI.current = api;
    setIsSupported(api !== null);
    
    if (!api) {
      console.log('[PTT] Web Speech API not supported in this browser');
    }
    
    // Load persisted permission state from localStorage
    try {
      const savedPermission = localStorage.getItem('ptt-microphone-permission');
      if (savedPermission === 'granted' || savedPermission === 'denied') {
        setPermissionStatus(savedPermission as PermissionState);
        console.log('[PTT] Loaded persisted permission state:', savedPermission);
      }
    } catch (error) {
      console.warn('[PTT] Failed to load permission state from localStorage:', error);
    }
  }, []);
  
  /**
   * Initialize speech recognition instance
   */
  const initializeSpeechRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI.current || recognitionRef.current) {
      return;
    }
    
    try {
      const recognition = new SpeechRecognitionAPI.current();
      
      // Configure recognition settings
      const config: SpeechRecognitionConfig = {
        continuous: true,
        interimResults: true,
        lang: 'en-US',
        maxAlternatives: 1
      };
      
      recognition.continuous = config.continuous;
      recognition.interimResults = config.interimResults;
      recognition.lang = config.lang;
      recognition.maxAlternatives = config.maxAlternatives;
      
      // Set up event handlers
      recognition.onresult = handleSpeechResult;
      recognition.onerror = handleSpeechError;
      recognition.onend = handleSpeechEnd;
      recognition.onstart = handleSpeechStart;
      
      recognitionRef.current = recognition;
      console.log('[PTT] Speech recognition initialized');
    } catch (error) {
      console.error('[PTT] Failed to initialize speech recognition:', error);
      setErrorState({
        hasError: true,
        errorType: 'service-not-allowed',
        errorMessage: ERROR_MESSAGES['service-not-allowed'],
        timestamp: Date.now(),
        canRetry: false
      });
    }
  }, []);
  
  /**
   * Handle speech recognition results
   */
  const handleSpeechResult = useCallback((event: Event) => {
    const speechEvent = event as unknown as SpeechRecognitionEvent;
    let interim = '';
    let final = '';
    
    // Process all results
    for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
      const result = speechEvent.results[i];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        final += transcript + ' ';
      } else {
        interim += transcript;
      }
    }
    
    // Update interim transcript
    if (interim) {
      setInterimTranscript(interim);
      if (onTranscriptionChange) {
        onTranscriptionChange(finalTranscript + interim);
      }
    }
    
    // Update final transcript
    if (final) {
      setFinalTranscript(prev => prev + final);
      setInterimTranscript('');
      if (onTranscriptionChange) {
        onTranscriptionChange(finalTranscript + final);
      }
    }
  }, [finalTranscript, onTranscriptionChange]);
  
  /**
   * Handle speech recognition errors
   */
  const handleSpeechError = useCallback((event: Event) => {
    const errorEvent = event as unknown as SpeechRecognitionErrorEvent;
    console.error('[PTT] Speech recognition error:', errorEvent.error, errorEvent);
    
    // Get enhanced error message with browser-specific instructions
    const userMessage = getEnhancedErrorMessage(errorEvent.error);
    const canRetry = !['not-allowed', 'service-not-allowed'].includes(errorEvent.error);
    
    setErrorState({
      hasError: true,
      errorType: errorEvent.error,
      errorMessage: userMessage,
      timestamp: Date.now(),
      canRetry
    });
    
    setRecordingState('error');
    isPressedRef.current = false;
    
    // Update and persist permission status if permission was denied
    if (errorEvent.error === 'not-allowed') {
      setPermissionStatus('denied');
      try {
        localStorage.setItem('ptt-microphone-permission', 'denied');
        console.log('[PTT] Persisted denied permission state');
      } catch (error) {
        console.warn('[PTT] Failed to persist permission state:', error);
      }
    }
    
    // Auto-dismiss error after 5 seconds
    setTimeout(() => {
      setErrorState(prev => ({
        ...prev,
        hasError: false,
        errorMessage: null
      }));
      setRecordingState('idle');
    }, 5000);
  }, []);
  
  /**
   * Handle speech recognition start
   */
  const handleSpeechStart = useCallback(() => {
    console.log('[PTT] Speech recognition started');
    setRecordingState('recording');
    if (onRecordingStateChange) {
      onRecordingStateChange(true);
    }
  }, [onRecordingStateChange]);
  
  /**
   * Handle speech recognition end
   * Handles silence during recording by restarting recognition if button is still pressed
   */
  const handleSpeechEnd = useCallback(() => {
    console.log('[PTT] Speech recognition ended');
    
    // Only process if we were actually recording
    if (isPressedRef.current) {
      // User is still holding the button, restart recognition to continue listening
      // This handles silence during recording - we don't auto-stop on silence
      if (recognitionRef.current && recordingState === 'recording') {
        try {
          console.log('[PTT] Restarting recognition to continue listening during silence');
          recognitionRef.current.start();
        } catch (error) {
          console.error('[PTT] Failed to restart recognition:', error);
          // If restart fails, stop recording gracefully
          isPressedRef.current = false;
          setRecordingState('idle');
          if (onRecordingStateChange) {
            onRecordingStateChange(false);
          }
        }
      }
    } else {
      // Button was released, finalize transcription
      setRecordingState('idle');
      if (onRecordingStateChange) {
        onRecordingStateChange(false);
      }
    }
  }, [recordingState, onRecordingStateChange]);
  
  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    console.log('[PTT] startRecording called', { 
      recordingState, 
      isPressedCurrent: isPressedRef.current,
      hasRecognition: !!recognitionRef.current 
    });
    
    // Prevent concurrent recordings
    if (recordingState === 'recording' || recordingState === 'requesting-permission') {
      console.log('[PTT] Recording already in progress, ignoring');
      return;
    }
    
    // CRITICAL: Check if recognition is already running
    if (recognitionRef.current) {
      try {
        // Try to stop any existing recognition first
        console.log('[PTT] Stopping existing recognition before starting new one');
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.log('[PTT] Error stopping existing recognition:', error);
      }
    }
    
    // Initialize recognition
    initializeSpeechRecognition();
    
    if (!recognitionRef.current) {
      console.error('[PTT] Failed to initialize speech recognition');
      return;
    }
    
    try {
      // Clear previous transcription
      setInterimTranscript('');
      setFinalTranscript('');
      
      // Request permission if needed
      if (permissionStatus === null || permissionStatus === 'prompt') {
        setRecordingState('requesting-permission');
        setPermissionStatus('prompt');
      }
      
      // Start recognition
      isPressedRef.current = true;
      recognitionRef.current.start();
      console.log('[PTT] Starting speech recognition');
      
      // Update and persist permission status on successful start
      if (permissionStatus !== 'granted') {
        setPermissionStatus('granted');
        try {
          localStorage.setItem('ptt-microphone-permission', 'granted');
          console.log('[PTT] Persisted granted permission state');
        } catch (error) {
          console.warn('[PTT] Failed to persist permission state:', error);
        }
      }
    } catch (error) {
      console.error('[PTT] Failed to start speech recognition:', error);
      
      // Determine error type based on the error
      let errorType: SpeechRecognitionErrorType = 'audio-capture';
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('Network')) {
          errorType = 'network';
        } else if (error.message.includes('permission') || error.message.includes('Permission')) {
          errorType = 'not-allowed';
        }
      }
      
      setErrorState({
        hasError: true,
        errorType,
        errorMessage: getEnhancedErrorMessage(errorType),
        timestamp: Date.now(),
        canRetry: errorType !== 'not-allowed'
      });
      setRecordingState('error');
      isPressedRef.current = false;
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => {
        setErrorState(prev => ({
          ...prev,
          hasError: false,
          errorMessage: null
        }));
        setRecordingState('idle');
      }, 5000);
    }
  }, [recordingState, permissionStatus, initializeSpeechRecognition]);
  
  /**
   * Stop recording and submit transcription
   */
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current || !isPressedRef.current) {
      return;
    }
    
    isPressedRef.current = false;
    
    try {
      recognitionRef.current.stop();
      console.log('[PTT] Stopping speech recognition');
      
      // Submit transcription if not empty
      const fullTranscript = (finalTranscript + ' ' + interimTranscript).trim();
      if (fullTranscript) {
        onTranscriptionComplete(fullTranscript);
        console.log('[PTT] Submitted transcription:', fullTranscript);
      } else {
        console.log('[PTT] Empty transcription, not submitting');
      }
      
      // Reset state
      setInterimTranscript('');
      setFinalTranscript('');
      setRecordingState('idle');
      
      if (onRecordingStateChange) {
        onRecordingStateChange(false);
      }
    } catch (error) {
      console.error('[PTT] Failed to stop speech recognition:', error);
    }
  }, [finalTranscript, interimTranscript, onTranscriptionComplete, onRecordingStateChange]);
  
  /**
   * Handle mouse down event
   * Prevents concurrent recordings by checking if already recording
   */
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    console.log('[PTT] Mouse down event', { disabled, isPressedCurrent: isPressedRef.current });
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !isPressedRef.current) {
      console.log('[PTT] Starting recording from mouse down');
      // Immediate visual feedback (< 100ms)
      setIsPressed(true);
      startRecording();
    }
  }, [disabled, startRecording]);
  
  /**
   * Handle mouse up event
   * Only stops recording if currently recording
   */
  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    console.log('[PTT] Mouse up event', { disabled, isPressedCurrent: isPressedRef.current });
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && isPressedRef.current) {
      console.log('[PTT] Stopping recording from mouse up');
      // Remove pressed state immediately
      setIsPressed(false);
      stopRecording();
    } else {
      console.log('[PTT] Mouse up ignored - not recording or disabled');
    }
  }, [disabled, stopRecording]);
  
  /**
   * Handle key down event (Space or Enter)
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;
    
    // Only handle Space and Enter keys
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      
      // Prevent repeated keydown events while key is held
      if (!isPressedRef.current) {
        // Immediate visual feedback (< 100ms)
        setIsPressed(true);
        startRecording();
      }
    }
  }, [disabled, startRecording]);
  
  /**
   * Handle key up event (Space or Enter)
   */
  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;
    
    // Only handle Space and Enter keys
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      // Remove pressed state immediately
      setIsPressed(false);
      stopRecording();
    }
  }, [disabled, stopRecording]);
  
  /**
   * Handle focus event
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);
  
  /**
   * Handle blur event
   */
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);
  
  /**
   * CRITICAL FIX: Add global mouseup listener to ensure recording always stops
   * This handles cases where mouseup doesn't fire on the overlay (e.g., mouse moves outside)
   */
  useEffect(() => {
    const handleGlobalMouseUp = (event: MouseEvent) => {
      if (isPressedRef.current) {
        console.log('[PTT] Global mouseup detected, stopping recording');
        setIsPressed(false);
        stopRecording();
      }
    };
    
    // Add global listener when recording starts
    if (recordingState === 'recording') {
      console.log('[PTT] Adding global mouseup listener');
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        console.log('[PTT] Removing global mouseup listener');
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [recordingState, stopRecording]);
  
  /**
   * Clean up on unmount
   * Handles component unmount during recording by stopping recognition
   * and cleaning up all state
   */
  useEffect(() => {
    return () => {
      // Stop recording if in progress
      if (isPressedRef.current) {
        isPressedRef.current = false;
        console.log('[PTT] Component unmounting during recording, cleaning up');
      }
      
      // Stop and clean up speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (error) {
          console.error('[PTT] Error cleaning up speech recognition:', error);
        }
      }
    };
  }, []);
  
  // Don't render if browser doesn't support Web Speech API
  if (!isSupported) {
    return null;
  }
  
  const isRecording = recordingState === 'recording';
  const isRequestingPermission = recordingState === 'requesting-permission';
  
  return (
    <div className={`push-to-talk-container ${className}`}>
      {/* Error Alert with ARIA live region */}
      {errorState.hasError && errorState.errorMessage && (
        <div role="alert" aria-live="assertive" aria-atomic="true">
          <Alert
            type="error"
            dismissible
            onDismiss={() => setErrorState({ ...errorState, hasError: false, errorMessage: null })}
          >
            {errorState.errorMessage}
          </Alert>
        </div>
      )}
      
      {/* Push-to-Talk Button - Cloudscape Button with overlay for press-and-hold */}
      <div 
        className={`ptt-button-container-wrapper ${isPressed ? 'pressed' : ''}`}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <Button
          iconName="microphone"
          variant={isRecording ? "primary" : "normal"}
          disabled={disabled || recordingState === 'error'}
        />
        {/* Transparent overlay to capture press-and-hold events */}
        <div
          className="ptt-button-overlay"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={isRecording ? "Recording voice input. Release to submit." : "Press and hold to speak. Use Space or Enter key."}
          aria-pressed={isRecording}
          aria-describedby={isRecording ? "recording-status" : undefined}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
            zIndex: 1
          }}
        />
      </div>
      
      {/* Hidden status for screen readers only */}
      {isRecording && (
        <div 
          id="recording-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
        >
          Recording voice input
        </div>
      )}
    </div>
  );
};

export default PushToTalkButton;
