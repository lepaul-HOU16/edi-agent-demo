import '@testing-library/jest-dom'

// Extend Jest matchers for better TypeScript support
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmptyDOMElement(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveAccessibleDescription(expectedAccessibleDescription?: string | RegExp): R;
      toHaveAccessibleName(expectedAccessibleName?: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string | RegExp): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: { [name: string]: any }): R;
      toHaveStyle(css: string | object): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toHaveValue(value?: string | number | string[]): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveDescription(text?: string | RegExp): R;
    }
  }
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock AWS Amplify
jest.mock('aws-amplify/storage', () => ({
  getUrl: jest.fn().mockResolvedValue({ url: 'mock-url' }),
}))

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}))

// Global test setup
global.console = {
  ...console,
  // Uncomment to ignore specific console errors during tests
  // error: jest.fn(),
  // warn: jest.fn(),
}

// Add TextEncoder/TextDecoder polyfill for Node.js environment
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock Cloudscape Design System components
jest.mock('@cloudscape-design/components/box', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'cloudscape-box', ...props }, children)
}));

jest.mock('@cloudscape-design/components/status-indicator', () => ({
  __esModule: true,
  default: ({ children, type, ...props }: any) =>
    React.createElement('div', { 'data-testid': 'cloudscape-status-indicator', 'data-type': type, ...props }, children)
}));

jest.mock('@cloudscape-design/components/progress-bar', () => ({
  __esModule: true,
  default: ({ value, label, description, additionalInfo, ...props }: any) =>
    React.createElement('div', { 'data-testid': 'cloudscape-progress-bar', 'data-value': value, ...props }, [
      label && React.createElement('div', { key: 'label' }, label),
      description && React.createElement('div', { key: 'description' }, description),
      additionalInfo && React.createElement('div', { key: 'additionalInfo' }, additionalInfo)
    ].filter(Boolean))
}));

jest.mock('@cloudscape-design/components/container', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    React.createElement('div', { 'data-testid': 'cloudscape-container', ...props }, children)
}));

jest.mock('@cloudscape-design/components/space-between', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    React.createElement('div', { 'data-testid': 'cloudscape-space-between', ...props }, children)
}));
