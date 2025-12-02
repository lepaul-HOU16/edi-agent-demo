/**
 * Tests for Speech Recognition Mock
 * 
 * Validates that the mock SpeechRecognition implementation works correctly.
 * These tests ensure the test infrastructure itself is reliable.
 */

import {
  MockSpeechRecognition,
  createMockSpeechRecognition,
  setupSpeechRecognitionMock,
  cleanupSpeechRecognitionMock
} from './speechRecognitionMock';

describe('MockSpeechRecognition', () => {
  let mock: MockSpeechRecognition;

  beforeEach(() => {
    mock = createMockSpeechRecognition();
  });

  afterEach(() => {
    mock.reset();
  });

  describe('Basic Lifecycle', () => {
    it('should start recognition', () => {
      const onStart = jest.fn();
      mock.onstart = onStart;

      mock.start();

      expect(mock.isStarted).toBe(true);
      // Event is emitted asynchronously
      setTimeout(() => {
        expect(onStart).toHaveBeenCalled();
      }, 10);
    });

    it('should stop recognition', (done) => {
      const onEnd = jest.fn();
      mock.onend = onEnd;

      mock.start();
      mock.stop();

      expect(mock.isStarted).toBe(false);
      setTimeout(() => {
        expect(onEnd).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should abort recognition', (done) => {
      const onEnd = jest.fn();
      mock.onend = onEnd;

      mock.start();
      mock.abort();

      expect(mock.isStarted).toBe(false);
      expect(mock.isAborted).toBe(true);
      setTimeout(() => {
        expect(onEnd).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should throw error if started twice', () => {
      mock.start();
      expect(() => mock.start()).toThrow('Recognition already started');
    });
  });

  describe('Configuration', () => {
    it('should allow setting continuous mode', () => {
      mock.continuous = true;
      expect(mock.continuous).toBe(true);
    });

    it('should allow setting interim results', () => {
      mock.interimResults = true;
      expect(mock.interimResults).toBe(true);
    });

    it('should allow setting language', () => {
      mock.lang = 'es-ES';
      expect(mock.lang).toBe('es-ES');
    });

    it('should allow setting max alternatives', () => {
      mock.maxAlternatives = 3;
      expect(mock.maxAlternatives).toBe(3);
    });
  });

  describe('Result Events', () => {
    it('should emit interim results', (done) => {
      const onResult = jest.fn();
      mock.onresult = onResult;

      mock.start();
      mock.emitInterimResult('hello');

      setTimeout(() => {
        expect(onResult).toHaveBeenCalled();
        const event = onResult.mock.calls[0][0];
        expect(event.results[0].transcript).toBe('hello');
        expect(event.results[0].isFinal).toBe(false);
        done();
      }, 10);
    });

    it('should emit final results', (done) => {
      const onResult = jest.fn();
      mock.onresult = onResult;

      mock.start();
      mock.emitFinalResult('hello world');

      setTimeout(() => {
        expect(onResult).toHaveBeenCalled();
        const event = onResult.mock.calls[0][0];
        expect(event.results[0].transcript).toBe('hello world');
        expect(event.results[0].isFinal).toBe(true);
        done();
      }, 10);
    });

    it('should include confidence scores', (done) => {
      const onResult = jest.fn();
      mock.onresult = onResult;

      mock.start();
      mock.emitFinalResult('test', 0.95);

      setTimeout(() => {
        const event = onResult.mock.calls[0][0];
        expect(event.results[0].confidence).toBe(0.95);
        done();
      }, 10);
    });
  });

  describe('Error Events', () => {
    it('should emit error events', (done) => {
      const onError = jest.fn();
      mock.onerror = onError;

      mock.start();
      mock.emitError('no-speech', 'No speech detected');

      setTimeout(() => {
        expect(onError).toHaveBeenCalled();
        const event = onError.mock.calls[0][0];
        expect(event.error).toBe('no-speech');
        expect(event.message).toBe('No speech detected');
        done();
      }, 10);
    });

    it('should emit different error types', (done) => {
      const onError = jest.fn();
      mock.onerror = onError;

      mock.start();
      mock.emitError('network');

      setTimeout(() => {
        const event = onError.mock.calls[0][0];
        expect(event.error).toBe('network');
        done();
      }, 10);
    });
  });

  describe('Audio Events', () => {
    it('should emit audio start event', (done) => {
      const onAudioStart = jest.fn();
      mock.onaudiostart = onAudioStart;

      mock.start();
      mock.emitAudioStart();

      setTimeout(() => {
        expect(onAudioStart).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should emit audio end event', (done) => {
      const onAudioEnd = jest.fn();
      mock.onaudioend = onAudioEnd;

      mock.start();
      mock.emitAudioEnd();

      setTimeout(() => {
        expect(onAudioEnd).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('Speech Events', () => {
    it('should emit speech start event', (done) => {
      const onSpeechStart = jest.fn();
      mock.onspeechstart = onSpeechStart;

      mock.start();
      mock.emitSpeechStart();

      setTimeout(() => {
        expect(onSpeechStart).toHaveBeenCalled();
        done();
      }, 10);
    });

    it('should emit speech end event', (done) => {
      const onSpeechEnd = jest.fn();
      mock.onspeechend = onSpeechEnd;

      mock.start();
      mock.emitSpeechEnd();

      setTimeout(() => {
        expect(onSpeechEnd).toHaveBeenCalled();
        done();
      }, 10);
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      mock.continuous = true;
      mock.interimResults = true;
      mock.lang = 'es-ES';
      mock.maxAlternatives = 5;
      mock.start();

      mock.reset();

      expect(mock.continuous).toBe(false);
      expect(mock.interimResults).toBe(false);
      expect(mock.lang).toBe('en-US');
      expect(mock.maxAlternatives).toBe(1);
      expect(mock.isStarted).toBe(false);
      expect(mock.isAborted).toBe(false);
    });
  });
});

describe('Global Mock Setup', () => {
  afterEach(() => {
    cleanupSpeechRecognitionMock();
  });

  it('should setup global SpeechRecognition mock', () => {
    const mock = setupSpeechRecognitionMock();

    expect(global.SpeechRecognition).toBeDefined();
    expect(global.webkitSpeechRecognition).toBeDefined();
    expect(mock).toBeInstanceOf(MockSpeechRecognition);
  });

  it('should cleanup global mock', () => {
    setupSpeechRecognitionMock();
    cleanupSpeechRecognitionMock();

    expect((global as any).SpeechRecognition).toBeUndefined();
    expect((global as any).webkitSpeechRecognition).toBeUndefined();
  });
});
