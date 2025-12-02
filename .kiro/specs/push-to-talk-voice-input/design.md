# Design Document

## Overview

The push-to-talk (PTT) voice input feature adds speech-to-text capability to the chat interface, allowing users to speak their prompts instead of typing them. The feature integrates seamlessly with the existing ChatBox component and uses the browser-native Web Speech API for real-time transcription.

### Key Design Principles

1. **Non-intrusive Integration**: The PTT button integrates naturally into the existing UI without disrupting the current user experience
2. **Progressive Enhancement**: The feature is only available when browser support exists; users without support see no change
3. **Immediate Feedback**: Users receive real-time visual feedback during recording and transcription
4. **Accessibility First**: Full keyboard support and ARIA labels ensure the feature is accessible to all users
5. **State Coordination**: The PTT feature coordinates with the existing input visibility toggle to provide a cohesive experience

## Architecture

### Component Structure

```
ChatBox (existing)
├── Messages Container
├── Controls Container
│   ├── Grid Layout
│   │   ├── Empty Column
│   │   └── Input Column
│   │       ├── Input Background Container
│   │       │   ├── [NEW] PushToTalkButton
│   │       │   ├── ExpandablePromptInput
│   │       │   └── AgentSwitcher
│   │       └── Input Toggle Button
└── Scroll to Bottom FAB
```

### New Components

#### 1. PushToTalkButton Component

**Location**: `src/components/PushToTalkButton.tsx`

**Responsibilities**:
- Manage Web Speech API lifecycle
- Handle press-and-hold interaction
- Display recording state visually
- Show real-time transcription
- Submit transcription on release
- Handle errors and permissions

**Props Interface**:
```typescript
interface PushToTalkButtonProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionChange?: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  disabled?: boolean;
  className?: string;
}
```

#### 2. VoiceTranscriptionDisplay Component

**Location**: `src/components/VoiceTranscriptionDisplay.tsx`

**Responsibilities**:
- Display interim and final transcription results
- Match existing input box styling
- Show recording indicator
- Provide visual feedback during speech recognition

**Props Interface**:
```typescript
interface VoiceTranscriptionDisplayProps {
  transcription: string;
  isRecording: boolean;
  isVisible: boolean;
}
```

### Integration Points

#### ChatBox Component Modifications

1. **State Management**:
   - Add `isVoiceRecording` state to track PTT active state
   - Add `voiceTranscription` state to store interim transcription
   - Coordinate with existing `isInputVisible` state

2. **Input Visibility Logic**:
   - When PTT is activated and input is visible → hide input
   - Keep input hidden after recording completes
   - User can manually show input via toggle button

3. **Submission Flow**:
   - PTT transcription uses existing `handleSend` function
   - No changes needed to message sending logic
   - Transcription is treated identically to typed input

## Components and Interfaces

### PushToTalkButton Component

```typescript
// src/components/PushToTalkButton.tsx

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface PushToTalkButtonProps {
  onTranscriptionComplete: (text: string) => void;
  onTranscriptionChange?: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  disabled?: boolean;
  className?: string;
}

interface PushToTalkButtonState {
  isRecording: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  error: string | null;
  interimTranscript: string;
  finalTranscript: string;
}
```

**Key Methods**:
- `initializeSpeechRecognition()`: Set up Web Speech API
- `startRecording()`: Begin speech recognition
- `stopRecording()`: End speech recognition and submit
- `handleSpeechResult()`: Process transcription results
- `handleSpeechError()`: Handle recognition errors
- `requestMicrophonePermission()`: Request browser permissions

### VoiceTranscriptionDisplay Component

```typescript
// src/components/VoiceTranscriptionDisplay.tsx

interface VoiceTranscriptionDisplayProps {
  transcription: string;
  isRecording: boolean;
  isVisible: boolean;
}
```

**Styling Requirements**:
- Match existing `ExpandablePromptInput` visual design
- Use same background, border, and padding
- Include pulsing microphone icon during recording
- Show "Listening..." indicator
- Display transcription text in real-time

### ChatBox Integration

```typescript
// Additions to src/components/ChatBox.tsx

// New state
const [isVoiceRecording, setIsVoiceRecording] = useState(false);
const [voiceTranscription, setVoiceTranscription] = useState('');

// Handler for PTT transcription updates
const handleVoiceTranscriptionChange = useCallback((text: string) => {
  setVoiceTranscription(text);
}, []);

// Handler for PTT recording state changes
const handleVoiceRecordingStateChange = useCallback((isRecording: boolean) => {
  setIsVoiceRecording(isRecording);
  
  // Hide input when voice recording starts
  if (isRecording && isInputVisible) {
    setIsInputVisible(false);
  }
}, [isInputVisible]);

// Handler for PTT transcription completion
const handleVoiceTranscriptionComplete = useCallback((text: string) => {
  if (text.trim()) {
    handleSend(text);
  }
  setVoiceTranscription('');
  setIsVoiceRecording(false);
}, [handleSend]);
```

## Data Models

### Speech Recognition Types

```typescript
// src/types/speechRecognition.ts

// Extend Window interface for Web Speech API
interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

// Speech Recognition Configuration
interface SpeechRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
}

// Transcription State
interface TranscriptionState {
  interim: string;
  final: string;
  confidence: number;
}

// Error Types
type SpeechRecognitionErrorType =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface SpeechRecognitionError {
  type: SpeechRecognitionErrorType;
  message: string;
  userMessage: string;
}
```

### Component State Models

```typescript
// PTT Button State
interface PTTState {
  isRecording: boolean;
  isProcessing: boolean;
  hasError: boolean;
  errorMessage: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | null;
}

// Transcription Display State
interface TranscriptionDisplayState {
  text: string;
  isInterim: boolean;
  confidence: number;
  timestamp: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

**Redundant Properties Identified**:
1. Properties 1.5 and 4.1 both test interim result display - can be combined
2. Properties 1.2 and 9.3 both test real-time transcription updates - can be combined  
3. Properties 3.4 and 3.5 both test input toggle functionality - can be combined
4. Properties 10.1 and 10.2 both test integration with message sending - can be combined
5. Property 1.4 and 7.4 both test empty submission prevention - single edge case property

**Consolidated Property Set**:
- Core recording lifecycle properties (start, transcribe, stop, submit)
- State coordination properties (input visibility, button state)
- Error handling properties (permissions, network, timeouts)
- Accessibility properties (keyboard interaction)
- Visual feedback properties (animations, indicators)
- Integration properties (message submission, cleanup)

### Correctness Properties

Property 1: PTT activation starts speech recognition
*For any* button press event on the PTT Button, the system should initialize and start the Web Speech API speech recognition
**Validates: Requirements 1.1**

Property 2: Continuous transcription during recording
*For any* sequence of speech recognition interim results while the PTT Button is pressed, the system should display each interim result immediately in the transcription display
**Validates: Requirements 1.2, 1.5, 4.1, 9.3**

Property 3: Button release triggers submission
*For any* non-empty transcription when the PTT Button is released, the system should stop recording and call the message submission handler with the transcribed text
**Validates: Requirements 1.3**

Property 4: Empty transcription prevents submission
*For any* button release event where the transcription is empty or whitespace-only, the system should not trigger message submission and should return to idle state
**Validates: Requirements 1.4, 7.4**

Property 5: Final results replace interim results
*For any* speech recognition final result, the system should replace the current interim transcription with the final transcription text
**Validates: Requirements 4.2**

Property 6: Multiple interim results show latest only
*For any* sequence of multiple interim results, the system should display only the most recent interim result, replacing previous interim results
**Validates: Requirements 4.4**

Property 7: Final results accumulate
*For any* sequence of multiple final results, the system should concatenate them to build the complete transcription
**Validates: Requirements 4.5**

Property 8: Voice activation hides visible input
*For any* PTT Button press when the input box is visible, the system should hide the input box
**Validates: Requirements 3.1**

Property 9: Input stays hidden after recording
*For any* completed recording session that hid the input box, the input box should remain hidden after recording completes
**Validates: Requirements 3.2**

Property 10: Transcription displays with hidden input
*For any* transcription text generated while the input box is hidden, the system should display the transcription in the input box design style
**Validates: Requirements 3.3**

Property 11: Toggle always shows input
*For any* input toggle button click, the system should show the input box regardless of whether it was hidden by voice activation or manual toggle
**Validates: Requirements 3.4, 3.5**

Property 12: Permission state persists
*For any* granted microphone permission, subsequent PTT Button presses should not request permissions again
**Validates: Requirements 5.4**

Property 13: Concurrent recording prevention
*For any* PTT Button press while a recording is already active, the system should ignore the new press and maintain the current recording
**Validates: Requirements 7.1**

Property 14: Silence doesn't stop recording
*For any* period of silence during recording, the system should continue listening until the PTT Button is released
**Validates: Requirements 7.3**

Property 15: Keyboard activation starts recording
*For any* Space or Enter key press on the focused PTT Button, the system should activate recording
**Validates: Requirements 8.2**

Property 16: Keyboard release submits transcription
*For any* Space or Enter key release on the focused PTT Button, the system should stop recording and submit the transcription
**Validates: Requirements 8.3**

Property 17: Visual feedback timing
*For any* PTT Button press, the system should provide visual feedback (recording indicator) within 100 milliseconds
**Validates: Requirements 9.4**

Property 18: Recording indicator cleanup
*For any* recording stop event, the system should immediately remove the recording indicator from the UI
**Validates: Requirements 9.5**

Property 19: Voice submission uses existing flow
*For any* voice transcription submission, the system should call the same message sending handler used for typed input
**Validates: Requirements 10.1, 10.2**

Property 20: Submission clears transcription
*For any* successful voice input submission, the system should clear the transcription display
**Validates: Requirements 10.3**

Property 21: Submission resets button state
*For any* successful voice input submission, the system should reset the PTT Button to idle state
**Validates: Requirements 10.4**

Property 22: Submission preserves input visibility
*For any* voice input submission where the input was hidden by voice activation, the input should remain hidden after submission
**Validates: Requirements 10.5**

Property 23: Error handling displays user messages
*For any* speech recognition error (permissions, network, timeout, etc.), the system should display a user-friendly error message and return to idle state
**Validates: Requirements 6.5**

## Error Handling

### Error Categories

#### 1. Permission Errors

**Scenario**: User denies microphone access or revokes permissions

**Handling**:
- Display clear error message: "Microphone access is required for voice input. Please enable microphone permissions in your browser settings."
- Provide link to browser-specific permission instructions
- Return PTT button to idle state
- Log error for debugging

**User Recovery**:
- User can grant permissions and try again
- User can use typed input as fallback

#### 2. Browser Support Errors

**Scenario**: Browser doesn't support Web Speech API

**Handling**:
- Hide PTT button entirely (feature not available)
- No error message needed (feature is invisible)
- Log browser info for analytics

**User Recovery**:
- User uses typed input (no change to existing experience)
- Suggest modern browser in documentation

#### 3. Network Errors

**Scenario**: Network connectivity lost during recording

**Handling**:
- Display error message: "Network connection lost. Please check your connection and try again."
- Stop recording immediately
- Clear any partial transcription
- Return to idle state

**User Recovery**:
- User can retry after network is restored
- User can use typed input as fallback

#### 4. Recognition Errors

**Scenario**: Speech recognition fails to process audio

**Error Types**:
- `no-speech`: No speech detected
- `audio-capture`: Microphone hardware issue
- `aborted`: Recognition aborted
- `network`: Network issue during recognition
- `not-allowed`: Permissions denied
- `service-not-allowed`: Service not available
- `bad-grammar`: Grammar error (rare)
- `language-not-supported`: Language not supported

**Handling**:
- Map technical errors to user-friendly messages
- Display appropriate error message
- Stop recording and return to idle
- Log detailed error for debugging

**User Messages**:
```typescript
const errorMessages: Record<SpeechRecognitionErrorType, string> = {
  'no-speech': 'No speech detected. Please try again and speak clearly.',
  'audio-capture': 'Microphone not accessible. Please check your microphone connection.',
  'aborted': 'Recording was interrupted. Please try again.',
  'network': 'Network error occurred. Please check your connection.',
  'not-allowed': 'Microphone access denied. Please enable permissions.',
  'service-not-allowed': 'Speech recognition service unavailable. Please try again later.',
  'bad-grammar': 'Speech recognition error. Please try again.',
  'language-not-supported': 'Language not supported. Please check your browser settings.'
};
```

#### 5. Timeout Errors

**Scenario**: Speech recognition times out

**Handling**:
- Display message: "Recording timed out. Please try again."
- Clear any partial transcription
- Return to idle state

**User Recovery**:
- User can press PTT again to retry
- User can use typed input

### Error State Management

```typescript
interface ErrorState {
  hasError: boolean;
  errorType: SpeechRecognitionErrorType | null;
  errorMessage: string | null;
  timestamp: number;
  canRetry: boolean;
}

// Error recovery actions
const handleError = (error: SpeechRecognitionErrorEvent) => {
  // Log for debugging
  console.error('[PTT] Speech recognition error:', error);
  
  // Map to user-friendly message
  const userMessage = errorMessages[error.error] || 'An error occurred. Please try again.';
  
  // Update error state
  setErrorState({
    hasError: true,
    errorType: error.error,
    errorMessage: userMessage,
    timestamp: Date.now(),
    canRetry: !['not-allowed', 'service-not-allowed'].includes(error.error)
  });
  
  // Stop recording
  stopRecording();
  
  // Clear error after 5 seconds
  setTimeout(() => {
    setErrorState({
      hasError: false,
      errorType: null,
      errorMessage: null,
      timestamp: 0,
      canRetry: true
    });
  }, 5000);
};
```

### Error Display

Errors should be displayed using the existing Cloudscape Alert component:

```typescript
{errorState.hasError && (
  <Alert
    type="error"
    dismissible
    onDismiss={() => setErrorState({ ...errorState, hasError: false })}
  >
    {errorState.errorMessage}
  </Alert>
)}
```

## Testing Strategy

### Unit Testing

**Framework**: Jest + React Testing Library

**Test Coverage**:

1. **Component Rendering**:
   - PTT button renders when speech API is supported
   - PTT button hidden when speech API not supported
   - Transcription display renders with correct styling
   - Recording indicator appears during recording

2. **User Interactions**:
   - Mouse press/release on PTT button
   - Keyboard press/release (Space, Enter)
   - Button disabled state prevents interaction
   - Tooltip displays on hover and focus

3. **State Management**:
   - Recording state toggles correctly
   - Transcription updates with interim results
   - Final results replace interim results
   - Error state displays and clears

4. **Integration with ChatBox**:
   - Voice transcription calls handleSend
   - Input visibility coordinates with PTT
   - Submission clears transcription
   - Button resets after submission

**Example Unit Tests**:

```typescript
describe('PushToTalkButton', () => {
  it('should start recording on mouse press', () => {
    const { getByRole } = render(<PushToTalkButton {...props} />);
    const button = getByRole('button');
    
    fireEvent.mouseDown(button);
    
    expect(props.onRecordingStateChange).toHaveBeenCalledWith(true);
  });
  
  it('should submit transcription on mouse release', () => {
    const { getByRole } = render(<PushToTalkButton {...props} />);
    const button = getByRole('button');
    
    // Simulate recording with transcription
    fireEvent.mouseDown(button);
    act(() => {
      // Mock speech recognition result
      mockSpeechRecognition.emitResult('test transcription');
    });
    fireEvent.mouseUp(button);
    
    expect(props.onTranscriptionComplete).toHaveBeenCalledWith('test transcription');
  });
  
  it('should not submit empty transcription', () => {
    const { getByRole } = render(<PushToTalkButton {...props} />);
    const button = getByRole('button');
    
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    
    expect(props.onTranscriptionComplete).not.toHaveBeenCalled();
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations

**Property Tests**:

Each correctness property from the design document should be implemented as a property-based test. Tests should be tagged with comments referencing the design document.

**Example Property Tests**:

```typescript
import fc from 'fast-check';

describe('PTT Property-Based Tests', () => {
  /**
   * Feature: push-to-talk-voice-input, Property 2: Continuous transcription during recording
   * For any sequence of interim results, each should be displayed immediately
   */
  it('should display all interim results in sequence', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 20 }),
        (interimResults) => {
          const { getByRole, getByText } = render(<PushToTalkButton {...props} />);
          const button = getByRole('button');
          
          fireEvent.mouseDown(button);
          
          // Emit each interim result
          interimResults.forEach(result => {
            act(() => {
              mockSpeechRecognition.emitInterimResult(result);
            });
            
            // Verify result is displayed
            expect(getByText(result)).toBeInTheDocument();
          });
          
          fireEvent.mouseUp(button);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: push-to-talk-voice-input, Property 4: Empty transcription prevents submission
   * For any whitespace-only string, submission should not occur
   */
  it('should not submit whitespace-only transcriptions', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim() === ''),
        (whitespaceString) => {
          const onComplete = jest.fn();
          const { getByRole } = render(
            <PushToTalkButton {...props} onTranscriptionComplete={onComplete} />
          );
          const button = getByRole('button');
          
          fireEvent.mouseDown(button);
          act(() => {
            mockSpeechRecognition.emitResult(whitespaceString);
          });
          fireEvent.mouseUp(button);
          
          expect(onComplete).not.toHaveBeenCalled();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: push-to-talk-voice-input, Property 7: Final results accumulate
   * For any sequence of final results, they should concatenate
   */
  it('should concatenate multiple final results', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        (finalResults) => {
          const { getByRole, getByText } = render(<PushToTalkButton {...props} />);
          const button = getByRole('button');
          
          fireEvent.mouseDown(button);
          
          // Emit each final result
          finalResults.forEach(result => {
            act(() => {
              mockSpeechRecognition.emitFinalResult(result);
            });
          });
          
          // Verify concatenated result
          const expected = finalResults.join(' ');
          expect(getByText(expected)).toBeInTheDocument();
          
          fireEvent.mouseUp(button);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: push-to-talk-voice-input, Property 19: Voice submission uses existing flow
   * For any transcription, voice submission should call the same handler as typed input
   */
  it('should use same submission handler for voice and typed input', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (transcription) => {
          const handleSend = jest.fn();
          const { getByRole } = render(
            <ChatBox {...chatBoxProps} handleSend={handleSend} />
          );
          
          // Submit via voice
          const pttButton = getByRole('button', { name: /push to talk/i });
          fireEvent.mouseDown(pttButton);
          act(() => {
            mockSpeechRecognition.emitResult(transcription);
          });
          fireEvent.mouseUp(pttButton);
          
          // Verify handleSend was called with transcription
          expect(handleSend).toHaveBeenCalledWith(transcription);
          
          // Reset mock
          handleSend.mockClear();
          
          // Submit same text via typed input
          const input = getByRole('textbox');
          fireEvent.change(input, { target: { value: transcription } });
          fireEvent.submit(input);
          
          // Verify same handler was called
          expect(handleSend).toHaveBeenCalledWith(transcription);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Test Scenarios**:

1. **End-to-End Voice Input Flow**:
   - User presses PTT button
   - Speaks into microphone (mocked)
   - Sees real-time transcription
   - Releases button
   - Message is sent to chat
   - Transcription is cleared
   - Button returns to idle

2. **Input Visibility Coordination**:
   - Input visible initially
   - User presses PTT
   - Input hides automatically
   - Recording completes
   - Input stays hidden
   - User clicks toggle
   - Input shows again

3. **Error Recovery**:
   - User presses PTT
   - Permission denied
   - Error message displays
   - User grants permission
   - User presses PTT again
   - Recording works

4. **Keyboard Accessibility**:
   - User tabs to PTT button
   - Focus indicator appears
   - User presses Space
   - Recording starts
   - User releases Space
   - Recording stops and submits

### Browser Compatibility Testing

**Manual Testing Required**:

- Chrome/Edge (webkitSpeechRecognition)
- Safari (webkitSpeechRecognition with specific config)
- Firefox (limited support, button should hide)
- Mobile browsers (iOS Safari, Chrome Android)

**Test Matrix**:

| Browser | Version | Expected Behavior |
|---------|---------|-------------------|
| Chrome | Latest | Full support |
| Edge | Latest | Full support |
| Safari | Latest | Full support with config |
| Firefox | Latest | Button hidden (no support) |
| iOS Safari | Latest | Full support |
| Chrome Android | Latest | Full support |

## Implementation Notes

### Browser-Specific Considerations

#### Chrome/Edge
- Use `webkitSpeechRecognition`
- Excellent support for continuous recognition
- Good interim result quality

#### Safari
- Use `webkitSpeechRecognition`
- Requires user gesture to start (button press satisfies this)
- May need `continuous: false` for better reliability
- Test thoroughly on iOS Safari

#### Firefox
- No Web Speech API support as of 2024
- Hide PTT button entirely
- Users fall back to typed input

### Performance Considerations

1. **Debouncing**: Interim results can fire rapidly; consider debouncing UI updates if performance issues arise
2. **Memory**: Clean up speech recognition instance on unmount
3. **Event Listeners**: Remove all event listeners when component unmounts
4. **State Updates**: Use functional state updates to avoid stale closures

### Accessibility Considerations

1. **ARIA Labels**: Provide clear labels for screen readers
2. **Keyboard Support**: Full keyboard navigation and activation
3. **Focus Management**: Visible focus indicators
4. **Error Announcements**: Use ARIA live regions for error messages
5. **Alternative Input**: Typed input always available as fallback

### Security Considerations

1. **Permissions**: Always request microphone permissions explicitly
2. **HTTPS**: Web Speech API requires HTTPS in production
3. **Privacy**: Inform users that speech is processed by browser/cloud service
4. **Data**: Transcriptions are ephemeral (not stored unless submitted)

## Future Enhancements

### Phase 2 Features (Not in Current Scope)

1. **Language Selection**: Allow users to choose recognition language
2. **Voice Commands**: Special commands like "send", "cancel", "clear"
3. **Continuous Mode**: Keep recording across multiple submissions
4. **Transcription History**: Show recent voice inputs
5. **Audio Visualization**: Waveform or volume meter during recording
6. **Offline Support**: Local speech recognition (if browser supports)
7. **Custom Wake Word**: "Hey Assistant" to activate PTT
8. **Voice Feedback**: Audio confirmation of actions

### Potential Improvements

1. **Smart Punctuation**: Auto-add punctuation based on pauses
2. **Noise Cancellation**: Filter background noise
3. **Confidence Threshold**: Only show high-confidence transcriptions
4. **Multi-Language**: Auto-detect spoken language
5. **Voice Profiles**: User-specific voice training

## Dependencies

### Required Libraries

- **React**: ^18.0.0 (existing)
- **@mui/material**: ^5.0.0 (existing)
- **@cloudscape-design/components**: ^3.0.0 (existing)

### Browser APIs

- **Web Speech API**: `SpeechRecognition` / `webkitSpeechRecognition`
- **MediaDevices API**: For microphone permissions
- **Permissions API**: For checking permission status (optional)

### Development Dependencies

- **@testing-library/react**: For unit tests
- **@testing-library/user-event**: For interaction tests
- **jest**: Test runner
- **fast-check**: Property-based testing
- **@types/dom-speech-recognition**: TypeScript types

## Deployment Considerations

### Environment Requirements

- **HTTPS**: Required for microphone access in production
- **Browser Support**: Modern browsers with Web Speech API
- **Network**: Internet connection required (cloud-based recognition)

### Feature Flags

Consider adding a feature flag to enable/disable PTT:

```typescript
const ENABLE_PUSH_TO_TALK = process.env.REACT_APP_ENABLE_PTT === 'true';
```

### Monitoring

Track the following metrics:

- PTT button usage frequency
- Success rate of voice transcriptions
- Error rates by type
- Browser/device distribution
- Average transcription length
- Time from press to submission

### Rollout Strategy

1. **Phase 1**: Deploy to development environment
2. **Phase 2**: Enable for internal testing (feature flag)
3. **Phase 3**: Beta release to subset of users
4. **Phase 4**: Full production rollout
5. **Phase 5**: Monitor and iterate based on feedback

## Summary

The push-to-talk voice input feature provides a hands-free alternative to typed input, leveraging browser-native speech recognition for real-time transcription. The design prioritizes seamless integration with the existing ChatBox component, comprehensive error handling, and full accessibility support. Property-based testing ensures correctness across a wide range of inputs and scenarios, while unit tests validate specific behaviors and edge cases.
