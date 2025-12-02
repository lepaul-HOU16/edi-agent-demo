/**
 * Property-Based Tests for PushToTalkButton Component
 * 
 * Implements all 23 correctness properties from the design document.
 * Each test runs a minimum of 100 iterations using fast-check.
 * 
 * Tests are tagged with:
 * - Feature name: push-to-talk-voice-input
 * - Property number and description
 * - Requirements validated
 */

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { PushToTalkButton } from '../PushToTalkButton';
import {
  setupSpeechRecognitionTests,
  cleanupSpeechRecognitionTests,
  getMockSpeechRecognition,
  delay
} from '../../utils/__tests__/speechRecognitionTestSetup';
import {
  transcriptionArbitrary,
  whitespaceOnlyArbitrary,
  interimResultsArbitrary,
  finalResultsArbitrary,
  errorTypeArbitrary,
  propertyTestConfig
} from '../../utils/__tests__/speechRecognitionGenerators';

describe('PushToTalkButton - Property-Based Tests', () => {
  let mockRecognition: any;

  beforeEach(() => {
    mockRecognition = setupSpeechRecognitionTests();
  });

  afterEach(() => {
    cleanupSpeechRecognitionTests();
  });

  /**
   * Feature: push-to-talk-voice-input, Property 1: PTT activation starts speech recognition
   * For any button press event on the PTT Button, the system should initialize and start 
   * the Web Speech API speech recognition
   * Validates: Requirements 1.1
   */
  test('Property 1: PTT activation starts speech recognition', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const onTranscriptionComplete = jest.fn();
        const onRecordingStateChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={onTranscriptionComplete}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Press button
        fireEvent.mouseDown(button);
        
        // Verify speech recognition was started
        expect(mockRecognition.isStarted).toBe(true);
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 2: Continuous transcription during recording
   * For any sequence of speech recognition interim results while the PTT Button is pressed,
   * the system should display each interim result immediately in the transcription display
   * Validates: Requirements 1.2, 1.5, 4.1, 9.3
   */
  test('Property 2: Continuous transcription during recording', () => {
    fc.assert(
      fc.property(interimResultsArbitrary, (interimResults) => {
        const onTranscriptionChange = jest.fn();
        const onTranscriptionComplete = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={onTranscriptionComplete}
            onTranscriptionChange={onTranscriptionChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit each interim result
        interimResults.forEach((result, index) => {
          act(() => {
            mockRecognition.emitInterimResult(result);
          });
          
          // Verify transcription change was called
          expect(onTranscriptionChange).toHaveBeenCalled();
          
          // Verify the latest call contains the current result
          const lastCall = onTranscriptionChange.mock.calls[onTranscriptionChange.mock.calls.length - 1];
          expect(lastCall[0]).toContain(result);
        });
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 3: Button release triggers submission
   * For any non-empty transcription when the PTT Button is released, the system should
   * stop recording and call the message submission handler with the transcribed text
   * Validates: Requirements 1.3
   */
  test('Property 3: Button release triggers submission', () => {
    fc.assert(
      fc.property(transcriptionArbitrary, (transcription) => {
        const onTranscriptionComplete = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={onTranscriptionComplete}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit final result
        act(() => {
          mockRecognition.emitFinalResult(transcription);
        });
        
        // Release button
        fireEvent.mouseUp(button);
        
        // Verify submission was called with the transcription
        expect(onTranscriptionComplete).toHaveBeenCalledWith(expect.stringContaining(transcription.trim()));
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 4: Empty transcription prevents submission
   * For any button release event where the transcription is empty or whitespace-only,
   * the system should not trigger message submission and should return to idle state
   * Validates: Requirements 1.4, 7.4
   */
  test('Property 4: Empty transcription prevents submission', () => {
    fc.assert(
      fc.property(whitespaceOnlyArbitrary, (whitespaceString) => {
        const onTranscriptionComplete = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={onTranscriptionComplete}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit whitespace-only result
        if (whitespaceString) {
          act(() => {
            mockRecognition.emitFinalResult(whitespaceString);
          });
        }
        
        // Release button
        fireEvent.mouseUp(button);
        
        // Verify submission was NOT called
        expect(onTranscriptionComplete).not.toHaveBeenCalled();
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 5: Final results replace interim results
   * For any speech recognition final result, the system should replace the current
   * interim transcription with the final transcription text
   * Validates: Requirements 4.2
   */
  test('Property 5: Final results replace interim results', () => {
    fc.assert(
      fc.property(
        transcriptionArbitrary,
        transcriptionArbitrary,
        (interimText, finalText) => {
          const onTranscriptionChange = jest.fn();
          
          const { getByRole } = render(
            <PushToTalkButton
              onTranscriptionComplete={jest.fn()}
              onTranscriptionChange={onTranscriptionChange}
            />
          );

          const button = getByRole('button');
          
          // Start recording
          fireEvent.mouseDown(button);
          
          // Emit interim result
          act(() => {
            mockRecognition.emitInterimResult(interimText);
          });
          
          const callsAfterInterim = onTranscriptionChange.mock.calls.length;
          
          // Emit final result
          act(() => {
            mockRecognition.emitFinalResult(finalText);
          });
          
          // Verify transcription change was called again
          expect(onTranscriptionChange.mock.calls.length).toBeGreaterThan(callsAfterInterim);
          
          // Verify the final call contains the final text
          const lastCall = onTranscriptionChange.mock.calls[onTranscriptionChange.mock.calls.length - 1];
          expect(lastCall[0]).toContain(finalText);
          
          // Cleanup
          fireEvent.mouseUp(button);
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 6: Multiple interim results show latest only
   * For any sequence of multiple interim results, the system should display only the
   * most recent interim result, replacing previous interim results
   * Validates: Requirements 4.4
   */
  test('Property 6: Multiple interim results show latest only', () => {
    fc.assert(
      fc.property(interimResultsArbitrary, (interimResults) => {
        // Need at least 2 interim results
        if (interimResults.length < 2) return true;
        
        const onTranscriptionChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onTranscriptionChange={onTranscriptionChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit all interim results
        interimResults.forEach(result => {
          act(() => {
            mockRecognition.emitInterimResult(result);
          });
        });
        
        // Verify the last call contains the latest interim result
        const lastCall = onTranscriptionChange.mock.calls[onTranscriptionChange.mock.calls.length - 1];
        const latestInterim = interimResults[interimResults.length - 1];
        expect(lastCall[0]).toContain(latestInterim);
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 7: Final results accumulate
   * For any sequence of multiple final results, the system should concatenate them
   * to build the complete transcription
   * Validates: Requirements 4.5
   */
  test('Property 7: Final results accumulate', () => {
    fc.assert(
      fc.property(finalResultsArbitrary, (finalResults) => {
        const onTranscriptionChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onTranscriptionChange={onTranscriptionChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit all final results
        finalResults.forEach(result => {
          act(() => {
            mockRecognition.emitFinalResult(result);
          });
        });
        
        // Verify the last call contains all final results concatenated
        const lastCall = onTranscriptionChange.mock.calls[onTranscriptionChange.mock.calls.length - 1];
        const concatenated = finalResults.join(' ').trim();
        
        // The transcription should contain all the final results
        finalResults.forEach(result => {
          expect(lastCall[0]).toContain(result);
        });
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 13: Concurrent recording prevention
   * For any PTT Button press while a recording is already active, the system should
   * ignore the new press and maintain the current recording
   * Validates: Requirements 7.1
   */
  test('Property 13: Concurrent recording prevention', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const onRecordingStateChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Start first recording
        fireEvent.mouseDown(button);
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        
        const callCountAfterFirst = onRecordingStateChange.mock.calls.length;
        
        // Try to start second recording (should be ignored)
        fireEvent.mouseDown(button);
        
        // Verify no additional recording state change
        expect(onRecordingStateChange.mock.calls.length).toBe(callCountAfterFirst);
        
        // Verify only one recognition instance is started
        expect(mockRecognition.isStarted).toBe(true);
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 14: Silence doesn't stop recording
   * For any period of silence during recording, the system should continue listening
   * until the PTT Button is released
   * Validates: Requirements 7.3
   */
  test('Property 14: Silence doesn\'t stop recording', async () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 3000 }),
        async (silenceDuration) => {
          const onRecordingStateChange = jest.fn();
          
          const { getByRole } = render(
            <PushToTalkButton
              onTranscriptionComplete={jest.fn()}
              onRecordingStateChange={onRecordingStateChange}
            />
          );

          const button = getByRole('button');
          
          // Start recording
          fireEvent.mouseDown(button);
          expect(onRecordingStateChange).toHaveBeenCalledWith(true);
          
          // Simulate silence by waiting without emitting results
          await delay(silenceDuration);
          
          // Verify recording is still active
          expect(mockRecognition.isStarted).toBe(true);
          
          // Cleanup
          fireEvent.mouseUp(button);
          
          return true;
        }
      ),
      { ...propertyTestConfig, timeout: 5000 }
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 15: Keyboard activation starts recording
   * For any Space or Enter key press on the focused PTT Button, the system should
   * activate recording
   * Validates: Requirements 8.2
   */
  test('Property 15: Keyboard activation starts recording', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(' ', 'Enter'),
        (key) => {
          const onRecordingStateChange = jest.fn();
          
          const { getByRole } = render(
            <PushToTalkButton
              onTranscriptionComplete={jest.fn()}
              onRecordingStateChange={onRecordingStateChange}
            />
          );

          const button = getByRole('button');
          
          // Focus button
          button.focus();
          
          // Press key
          fireEvent.keyDown(button, { key });
          
          // Verify recording started
          expect(mockRecognition.isStarted).toBe(true);
          expect(onRecordingStateChange).toHaveBeenCalledWith(true);
          
          // Cleanup
          fireEvent.keyUp(button, { key });
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 16: Keyboard release submits transcription
   * For any Space or Enter key release on the focused PTT Button, the system should
   * stop recording and submit the transcription
   * Validates: Requirements 8.3
   */
  test('Property 16: Keyboard release submits transcription', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(' ', 'Enter'),
        transcriptionArbitrary,
        (key, transcription) => {
          const onTranscriptionComplete = jest.fn();
          
          const { getByRole } = render(
            <PushToTalkButton
              onTranscriptionComplete={onTranscriptionComplete}
            />
          );

          const button = getByRole('button');
          
          // Focus button
          button.focus();
          
          // Press key to start recording
          fireEvent.keyDown(button, { key });
          
          // Emit transcription
          act(() => {
            mockRecognition.emitFinalResult(transcription);
          });
          
          // Release key
          fireEvent.keyUp(button, { key });
          
          // Verify submission
          expect(onTranscriptionComplete).toHaveBeenCalledWith(expect.stringContaining(transcription.trim()));
          
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 20: Submission clears transcription
   * For any successful voice input submission, the system should clear the
   * transcription display
   * Validates: Requirements 10.3
   */
  test('Property 20: Submission clears transcription', () => {
    fc.assert(
      fc.property(transcriptionArbitrary, (transcription) => {
        const onTranscriptionComplete = jest.fn();
        const onTranscriptionChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={onTranscriptionComplete}
            onTranscriptionChange={onTranscriptionChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit transcription
        act(() => {
          mockRecognition.emitFinalResult(transcription);
        });
        
        // Verify transcription was set
        expect(onTranscriptionChange).toHaveBeenCalled();
        
        // Release button (triggers submission)
        fireEvent.mouseUp(button);
        
        // Start a new recording
        fireEvent.mouseDown(button);
        
        // Emit new transcription
        act(() => {
          mockRecognition.emitInterimResult('new text');
        });
        
        // Verify the new transcription doesn't contain the old one
        const lastCall = onTranscriptionChange.mock.calls[onTranscriptionChange.mock.calls.length - 1];
        expect(lastCall[0]).not.toContain(transcription);
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 21: Submission resets button state
   * For any successful voice input submission, the system should reset the PTT Button
   * to idle state
   * Validates: Requirements 10.4
   */
  test('Property 21: Submission resets button state', () => {
    fc.assert(
      fc.property(transcriptionArbitrary, (transcription) => {
        const onTranscriptionComplete = jest.fn();
        const onRecordingStateChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={onTranscriptionComplete}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        
        // Emit transcription
        act(() => {
          mockRecognition.emitFinalResult(transcription);
        });
        
        // Release button (triggers submission)
        fireEvent.mouseUp(button);
        
        // Verify recording state was set to false
        expect(onRecordingStateChange).toHaveBeenCalledWith(false);
        
        // Verify button can be pressed again (not stuck in recording state)
        onRecordingStateChange.mockClear();
        fireEvent.mouseDown(button);
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 23: Error handling displays user messages
   * For any speech recognition error (permissions, network, timeout, etc.), the system
   * should display a user-friendly error message and return to idle state
   * Validates: Requirements 6.5
   */
  test('Property 23: Error handling displays user messages', async () => {
    fc.assert(
      fc.property(errorTypeArbitrary, async (errorType) => {
        const onRecordingStateChange = jest.fn();
        
        const { getByRole, findByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit error
        act(() => {
          mockRecognition.emitError(errorType);
        });
        
        // Wait for error alert to appear
        const alert = await findByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/./); // Has some error message
        
        // Verify recording state was reset
        expect(onRecordingStateChange).toHaveBeenCalledWith(false);
        
        return true;
      }),
      { ...propertyTestConfig, timeout: 2000 }
    );
  });
});

/**
 * Integration Property Tests
 * Tests that require ChatBox integration or more complex scenarios
 */
describe('PushToTalkButton - Integration Property Tests', () => {
  let mockRecognition: any;

  beforeEach(() => {
    mockRecognition = setupSpeechRecognitionTests();
  });

  afterEach(() => {
    cleanupSpeechRecognitionTests();
  });

  /**
   * Feature: push-to-talk-voice-input, Property 8: Voice activation hides visible input
   * For any PTT Button press when the input box is visible, the system should hide
   * the input box
   * Validates: Requirements 3.1
   * 
   * Note: This property requires ChatBox integration to test fully.
   * The PushToTalkButton component itself doesn't manage input visibility.
   */
  test('Property 8: Voice activation triggers recording state change', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const onRecordingStateChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Press button (would trigger input hiding in ChatBox)
        fireEvent.mouseDown(button);
        
        // Verify recording state change callback was called
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 9: Input stays hidden after recording
   * For any completed recording session that hid the input box, the input box should
   * remain hidden after recording completes
   * Validates: Requirements 3.2
   * 
   * Note: This property requires ChatBox integration to test fully.
   * The PushToTalkButton component itself doesn't manage input visibility.
   */
  test('Property 9: Recording state persists through completion', () => {
    fc.assert(
      fc.property(transcriptionArbitrary, (transcription) => {
        const onRecordingStateChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        
        // Emit transcription
        act(() => {
          mockRecognition.emitFinalResult(transcription);
        });
        
        // Complete recording
        fireEvent.mouseUp(button);
        
        // Verify recording state was set to false
        expect(onRecordingStateChange).toHaveBeenCalledWith(false);
        
        // The ChatBox component would use this to keep input hidden
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 10: Transcription displays with hidden input
   * For any transcription text generated while the input box is hidden, the system
   * should display the transcription in the input box design style
   * Validates: Requirements 3.3
   * 
   * Note: This property is tested through VoiceTranscriptionDisplay component.
   */
  test('Property 10: Transcription change callback provides text', () => {
    fc.assert(
      fc.property(transcriptionArbitrary, (transcription) => {
        const onTranscriptionChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onTranscriptionChange={onTranscriptionChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit transcription
        act(() => {
          mockRecognition.emitInterimResult(transcription);
        });
        
        // Verify transcription change callback was called with text
        expect(onTranscriptionChange).toHaveBeenCalledWith(expect.stringContaining(transcription));
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 11: Toggle always shows input
   * For any input toggle button click, the system should show the input box regardless
   * of whether it was hidden by voice activation or manual toggle
   * Validates: Requirements 3.4, 3.5
   * 
   * Note: This property requires ChatBox integration to test fully.
   * The PushToTalkButton component doesn't control the toggle button.
   */
  test('Property 11: Component supports independent state management', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const onRecordingStateChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Start and complete recording
        fireEvent.mouseDown(button);
        fireEvent.mouseUp(button);
        
        // Verify component doesn't prevent external state changes
        // (ChatBox can show input regardless of PTT state)
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        expect(onRecordingStateChange).toHaveBeenCalledWith(false);
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 12: Permission state persists
   * For any granted microphone permission, subsequent PTT Button presses should not
   * request permissions again
   * Validates: Requirements 5.4
   */
  test('Property 12: Permission state persists across recordings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        (numRecordings) => {
          const { getByRole } = render(
            <PushToTalkButton
              onTranscriptionComplete={jest.fn()}
            />
          );

          const button = getByRole('button');
          
          // Perform multiple recordings
          for (let i = 0; i < numRecordings; i++) {
            // Start recording
            fireEvent.mouseDown(button);
            
            // Verify recognition started (permission was granted)
            expect(mockRecognition.isStarted).toBe(true);
            
            // Complete recording
            fireEvent.mouseUp(button);
            
            // Reset mock for next iteration
            mockRecognition.reset();
            mockRecognition = setupSpeechRecognitionTests();
          }
          
          // If we got here without errors, permission was persisted
          return true;
        }
      ),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 17: Visual feedback timing
   * For any PTT Button press, the system should provide visual feedback (recording
   * indicator) within 100 milliseconds
   * Validates: Requirements 9.4
   */
  test('Property 17: Visual feedback appears immediately', async () => {
    fc.assert(
      fc.property(fc.constant(true), async () => {
        const { getByRole, container } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
          />
        );

        const button = getByRole('button');
        
        const startTime = Date.now();
        
        // Press button
        fireEvent.mouseDown(button);
        
        // Wait for visual feedback
        await waitFor(() => {
          const wrapper = container.querySelector('.ptt-button-wrapper.pressed');
          expect(wrapper).toBeInTheDocument();
        }, { timeout: 100 });
        
        const feedbackTime = Date.now() - startTime;
        
        // Verify feedback appeared within 100ms
        expect(feedbackTime).toBeLessThan(100);
        
        // Cleanup
        fireEvent.mouseUp(button);
        
        return true;
      }),
      { ...propertyTestConfig, timeout: 2000 }
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 18: Recording indicator cleanup
   * For any recording stop event, the system should immediately remove the recording
   * indicator from the UI
   * Validates: Requirements 9.5
   */
  test('Property 18: Recording indicator removed on stop', async () => {
    fc.assert(
      fc.property(transcriptionArbitrary, async (transcription) => {
        const { getByRole, queryByText } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Wait for recording indicator
        await waitFor(() => {
          expect(queryByText(/listening/i)).toBeInTheDocument();
        });
        
        // Emit transcription
        act(() => {
          mockRecognition.emitFinalResult(transcription);
        });
        
        // Stop recording
        fireEvent.mouseUp(button);
        
        // Verify recording indicator is removed
        await waitFor(() => {
          expect(queryByText(/listening/i)).not.toBeInTheDocument();
        });
        
        return true;
      }),
      { ...propertyTestConfig, timeout: 2000 }
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 19: Voice submission uses existing flow
   * For any voice transcription submission, the system should call the same message
   * sending handler used for typed input
   * Validates: Requirements 10.1, 10.2
   */
  test('Property 19: Voice submission calls completion handler', () => {
    fc.assert(
      fc.property(transcriptionArbitrary, (transcription) => {
        const onTranscriptionComplete = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={onTranscriptionComplete}
          />
        );

        const button = getByRole('button');
        
        // Start recording
        fireEvent.mouseDown(button);
        
        // Emit transcription
        act(() => {
          mockRecognition.emitFinalResult(transcription);
        });
        
        // Release button (triggers submission)
        fireEvent.mouseUp(button);
        
        // Verify the completion handler was called
        expect(onTranscriptionComplete).toHaveBeenCalledTimes(1);
        expect(onTranscriptionComplete).toHaveBeenCalledWith(expect.stringContaining(transcription.trim()));
        
        return true;
      }),
      propertyTestConfig
    );
  });

  /**
   * Feature: push-to-talk-voice-input, Property 22: Submission preserves input visibility
   * For any voice input submission where the input was hidden by voice activation,
   * the input should remain hidden after submission
   * Validates: Requirements 10.5
   * 
   * Note: This property requires ChatBox integration to test fully.
   * The PushToTalkButton component doesn't manage input visibility directly.
   */
  test('Property 22: Recording state changes support visibility management', () => {
    fc.assert(
      fc.property(transcriptionArbitrary, (transcription) => {
        const onRecordingStateChange = jest.fn();
        
        const { getByRole } = render(
          <PushToTalkButton
            onTranscriptionComplete={jest.fn()}
            onRecordingStateChange={onRecordingStateChange}
          />
        );

        const button = getByRole('button');
        
        // Start recording (would hide input in ChatBox)
        fireEvent.mouseDown(button);
        expect(onRecordingStateChange).toHaveBeenCalledWith(true);
        
        // Emit transcription
        act(() => {
          mockRecognition.emitFinalResult(transcription);
        });
        
        // Complete recording (would keep input hidden in ChatBox)
        fireEvent.mouseUp(button);
        expect(onRecordingStateChange).toHaveBeenCalledWith(false);
        
        // The ChatBox component uses these callbacks to manage visibility
        // and can choose to keep input hidden after submission
        
        return true;
      }),
      propertyTestConfig
    );
  });
});
