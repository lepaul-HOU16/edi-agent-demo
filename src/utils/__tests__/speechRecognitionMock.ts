/**
 * Mock SpeechRecognition Class for Testing
 * 
 * Provides a mock implementation of the Web Speech API for testing
 * the push-to-talk voice input feature.
 */

import { SpeechRecognitionErrorType } from '../../types/speechRecognition';

/**
 * Mock SpeechRecognition Result
 */
export class MockSpeechRecognitionResult implements SpeechRecognitionResult {
  public readonly isFinal: boolean;
  public readonly length: number = 1;

  constructor(
    public transcript: string,
    isFinal: boolean = false,
    public confidence: number = 1.0
  ) {
    this.isFinal = isFinal;
  }

  item(index: number): SpeechRecognitionAlternative {
    if (index === 0) {
      return this;
    }
    throw new Error('Index out of bounds');
  }

  [Symbol.iterator](): Iterator<SpeechRecognitionAlternative> {
    let index = 0;
    return {
      next: () => {
        if (index < this.length) {
          index++;
          return { value: this, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

/**
 * Mock SpeechRecognition Result List
 */
export class MockSpeechRecognitionResultList implements SpeechRecognitionResultList {
  private results: MockSpeechRecognitionResult[];
  [index: number]: SpeechRecognitionResult;

  constructor(results: MockSpeechRecognitionResult[]) {
    this.results = results;
    // Make results accessible via array index
    results.forEach((result, i) => {
      this[i] = result;
    });
  }

  get length(): number {
    return this.results.length;
  }

  item(index: number): SpeechRecognitionResult {
    return this.results[index];
  }

  [Symbol.iterator](): Iterator<SpeechRecognitionResult> {
    let index = 0;
    return {
      next: () => {
        if (index < this.results.length) {
          return { value: this.results[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

/**
 * Mock SpeechRecognition Event
 */
export class MockSpeechRecognitionEvent extends Event implements SpeechRecognitionEvent {
  constructor(
    type: string,
    public results: SpeechRecognitionResultList,
    public resultIndex: number = 0
  ) {
    super(type);
  }
}

/**
 * Mock SpeechRecognition Error Event
 */
export class MockSpeechRecognitionErrorEvent extends Event implements SpeechRecognitionErrorEvent {
  constructor(
    type: string,
    public error: SpeechRecognitionErrorType,
    public message: string = ''
  ) {
    super(type);
  }
}

/**
 * Mock SpeechRecognition Class
 * 
 * Simulates the Web Speech API for testing purposes.
 * Provides methods to emit events and control the recognition lifecycle.
 */
export class MockSpeechRecognition extends EventTarget implements SpeechRecognition {
  // Configuration properties
  public continuous: boolean = false;
  public interimResults: boolean = false;
  public lang: string = 'en-US';
  public maxAlternatives: number = 1;

  // State properties
  public isStarted: boolean = false;
  public isAborted: boolean = false;

  // Event handlers
  public onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  public onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  public onend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  public onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null = null;
  public onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
  public onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null = null;
  public onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  public onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  public onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  public onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null = null;
  public onstart: ((this: SpeechRecognition, ev: Event) => any) | null = null;

  // Grammar list (not commonly used)
  public grammars: SpeechGrammarList = {} as SpeechGrammarList;
  public serviceURI: string = '';

  /**
   * Start speech recognition
   */
  start(): void {
    if (this.isStarted) {
      throw new Error('Recognition already started');
    }
    this.isStarted = true;
    this.isAborted = false;

    // Emit start event
    setTimeout(() => {
      const event = new Event('start');
      this.dispatchEvent(event);
      if (this.onstart) {
        this.onstart.call(this, event);
      }
    }, 0);
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    if (!this.isStarted) {
      return;
    }
    this.isStarted = false;

    // Emit end event
    setTimeout(() => {
      const event = new Event('end');
      this.dispatchEvent(event);
      if (this.onend) {
        this.onend.call(this, event);
      }
    }, 0);
  }

  /**
   * Abort speech recognition
   */
  abort(): void {
    if (!this.isStarted) {
      return;
    }
    this.isStarted = false;
    this.isAborted = true;

    // Emit end event
    setTimeout(() => {
      const event = new Event('end');
      this.dispatchEvent(event);
      if (this.onend) {
        this.onend.call(this, event);
      }
    }, 0);
  }

  /**
   * Emit a result event (for testing)
   */
  emitResult(transcript: string, isFinal: boolean = false, confidence: number = 1.0): void {
    if (!this.isStarted) {
      throw new Error('Recognition not started');
    }

    const result = new MockSpeechRecognitionResult(transcript, isFinal, confidence);
    const resultList = new MockSpeechRecognitionResultList([result]);
    const event = new MockSpeechRecognitionEvent('result', resultList, 0);

    this.dispatchEvent(event);
    if (this.onresult) {
      this.onresult.call(this, event);
    }
  }

  /**
   * Emit an interim result event (for testing)
   */
  emitInterimResult(transcript: string, confidence: number = 0.8): void {
    this.emitResult(transcript, false, confidence);
  }

  /**
   * Emit a final result event (for testing)
   */
  emitFinalResult(transcript: string, confidence: number = 1.0): void {
    this.emitResult(transcript, true, confidence);
  }

  /**
   * Emit an error event (for testing)
   */
  emitError(errorType: SpeechRecognitionErrorType, message: string = ''): void {
    const event = new MockSpeechRecognitionErrorEvent('error', errorType, message);
    this.dispatchEvent(event);
    if (this.onerror) {
      this.onerror.call(this, event);
    }
  }

  /**
   * Emit audio start event (for testing)
   */
  emitAudioStart(): void {
    const event = new Event('audiostart');
    this.dispatchEvent(event);
    if (this.onaudiostart) {
      this.onaudiostart.call(this, event);
    }
  }

  /**
   * Emit audio end event (for testing)
   */
  emitAudioEnd(): void {
    const event = new Event('audioend');
    this.dispatchEvent(event);
    if (this.onaudioend) {
      this.onaudioend.call(this, event);
    }
  }

  /**
   * Emit speech start event (for testing)
   */
  emitSpeechStart(): void {
    const event = new Event('speechstart');
    this.dispatchEvent(event);
    if (this.onspeechstart) {
      this.onspeechstart.call(this, event);
    }
  }

  /**
   * Emit speech end event (for testing)
   */
  emitSpeechEnd(): void {
    const event = new Event('speechend');
    this.dispatchEvent(event);
    if (this.onspeechend) {
      this.onspeechend.call(this, event);
    }
  }

  /**
   * Reset the mock to initial state
   */
  reset(): void {
    this.isStarted = false;
    this.isAborted = false;
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    this.maxAlternatives = 1;
  }
}

/**
 * Create a mock SpeechRecognition instance
 */
export function createMockSpeechRecognition(): MockSpeechRecognition {
  return new MockSpeechRecognition();
}

/**
 * Setup global mock for SpeechRecognition
 * Call this in test setup to mock the Web Speech API
 */
export function setupSpeechRecognitionMock(): MockSpeechRecognition {
  const mockInstance = createMockSpeechRecognition();
  
  // Mock the global SpeechRecognition constructor
  (global as any).SpeechRecognition = jest.fn(() => mockInstance);
  (global as any).webkitSpeechRecognition = jest.fn(() => mockInstance);
  
  // Mock window.SpeechRecognition
  if (typeof window !== 'undefined') {
    (window as any).SpeechRecognition = (global as any).SpeechRecognition;
    (window as any).webkitSpeechRecognition = (global as any).webkitSpeechRecognition;
  }
  
  return mockInstance;
}

/**
 * Cleanup global mock for SpeechRecognition
 * Call this in test teardown
 */
export function cleanupSpeechRecognitionMock(): void {
  delete (global as any).SpeechRecognition;
  delete (global as any).webkitSpeechRecognition;
  
  if (typeof window !== 'undefined') {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  }
}
