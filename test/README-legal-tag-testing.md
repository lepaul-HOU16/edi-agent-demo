# Legal Tag Data Flow Testing Guide

This document provides comprehensive guidance for testing the legal tag data flow, including unit tests, integration tests, and manual testing scenarios.

## Overview

The legal tag testing suite validates the complete data flow from frontend UI components through the API service to the backend GraphQL endpoints. It covers:

- **Response parsing and normalization logic**
- **Error handling and classification**
- **End-to-end create/retrieve workflows**
- **Empty database and error conditions**
- **Performance and edge cases**

## Test Structure

```
frontend-uxpin/test/
├── unit/
│   ├── legalTagDataFlow.test.ts           # Comprehensive unit tests
│   ├── legalTagErrorHandler.test.ts       # Error handling tests
│   ├── responseNormalizer.test.ts         # Response parsing tests
│   └── osduApiServiceResponseNormalization.test.ts
├── integration/
│   ├── legalTagEndToEndFlow.test.ts       # E2E integration tests
│   └── OsduApiServiceIntegration.test.ts  # API service tests
├── manual/
│   └── legalTagManualTestScenarios.test.ts # Manual test scenarios
└── scripts/
    └── runLegalTagTests.js                # Test runner script
```

## Running Tests

### Quick Start

```bash
# Run all legal tag tests
npm run test:legal-tags

# Or use the test runner directly
node test/scripts/runLegalTagTests.js
```

### Specific Test Types

```bash
# Unit tests only
node test/scripts/runLegalTagTests.js --unit

# Integration tests only
node test/scripts/runLegalTagTests.js --integration

# Manual test guidance
node test/scripts/runLegalTagTests.js --manual

# Verbose output with coverage
node test/scripts/runLegalTagTests.js --all --verbose --coverage
```

### Individual Test Files

```bash
# Run specific test file
npm run test:specific test/unit/legalTagDataFlow.test.ts

# Run with verbose output
mocha --require tsx test/unit/legalTagDataFlow.test.ts --reporter spec
```

## Test Categories

### 1. Unit Tests (`test/unit/legalTagDataFlow.test.ts`)

Tests the core data processing logic in isolation:

#### Response Parsing Logic
- ✅ `listLegalTags` connection format parsing
- ✅ `getLegalTags` array format parsing
- ✅ Single object response handling
- ✅ Malformed JSON property parsing
- ✅ Empty response detection
- ✅ Error response classification

#### Error Handling Logic
- ✅ Network error classification
- ✅ Authentication error handling
- ✅ Schema error detection
- ✅ Data validation errors
- ✅ Service error classification
- ✅ Retry logic and delays

#### Data Transformation Logic
- ✅ JSON string property parsing
- ✅ Pagination format normalization
- ✅ Item filtering and validation
- ✅ Property type validation

### 2. Integration Tests (`test/integration/legalTagEndToEndFlow.test.ts`)

Tests the complete workflow integration:

#### Complete Create-Retrieve Flow
- ✅ Successful create followed by retrieve
- ✅ Create success with retrieve failure
- ✅ Create failure handling
- ✅ Data consistency validation

#### Query Fallback Mechanism
- ✅ Primary query failure with successful fallback
- ✅ Both primary and fallback query failures
- ✅ Response format handling consistency

#### Error Recovery and Retry Logic
- ✅ Network error retry behavior
- ✅ Authentication token refresh
- ✅ Concurrent operation handling

### 3. Manual Test Scenarios (`test/manual/legalTagManualTestScenarios.test.ts`)

Provides guidance for manual testing:

#### Empty Database Scenarios
- Empty database with proper UI feedback
- Transition from empty to populated state
- Create button functionality when empty

#### Error Condition Scenarios
- Network connectivity issues
- Authentication/authorization errors
- Server-side errors and maintenance modes
- Malformed or corrupted data responses

#### Edge Case Scenarios
- Extremely large legal tag lists
- Special characters and internationalization
- Concurrent operations and race conditions

#### Performance and Stress Testing
- High-load conditions
- Memory usage monitoring
- Response time validation

#### Browser Compatibility Testing
- Cross-browser functionality
- Mobile device compatibility
- Accessibility features

## Test Data and Mocking

### Mock Data Patterns

The tests use realistic mock data that matches production patterns:

```typescript
// Example legal tag for testing
const testLegalTag = {
  id: 'test-legal-tag-id',
  name: 'test-legal-tag-name',
  description: 'Test legal tag description',
  properties: {
    countryOfOrigin: ['US'],
    contractId: 'TEST-CONTRACT-001',
    originator: 'OSDU',
    expirationDate: '2025-12-31T23:59:59.999Z',
    dataType: 'Public Domain Data',
    securityClassification: 'Public',
    personalData: 'No Personal Data',
    exportClassification: 'EAR99'
  },
  status: 'ACTIVE',
  createdBy: 'test-user@example.com',
  createdAt: '2024-01-01T00:00:00.000Z'
};
```

### Response Format Mocking

Tests cover all expected response formats:

```typescript
// listLegalTags connection format
const connectionResponse = {
  data: {
    listLegalTags: {
      items: [testLegalTag],
      pagination: {
        nextToken: 'token-123',
        hasNextPage: true,
        totalCount: 10
      }
    }
  }
};

// getLegalTags array format
const arrayResponse = {
  data: {
    getLegalTags: [testLegalTag]
  }
};
```

## Error Scenarios Testing

### Network Errors
- Connection refused (`ECONNREFUSED`)
- Network timeouts (`ERR_NETWORK`)
- DNS resolution failures
- Intermittent connectivity

### Authentication Errors
- Expired tokens (401 Unauthorized)
- Insufficient permissions (403 Forbidden)
- Invalid credentials
- Session timeouts

### Server Errors
- Internal server errors (500)
- Service unavailable (503)
- Gateway timeouts (504)
- Maintenance mode responses

### Data Errors
- Malformed JSON responses
- Missing required fields
- Invalid data types
- Corrupted response data

## Performance Testing

### Load Testing Scenarios
- Large dataset handling (1000+ items)
- Concurrent user operations
- Memory usage monitoring
- Response time validation

### Stress Testing Metrics
- Success rate (target: >95%)
- Average response time (target: <1000ms)
- Memory usage stability
- Error rate under load

## Manual Testing Checklist

### Pre-Test Setup
- [ ] Valid authentication tokens available
- [ ] Test environment accessible
- [ ] Browser developer tools open
- [ ] Network monitoring enabled

### Empty Database Testing
- [ ] Navigate to legal tags page with empty database
- [ ] Verify empty state message displays
- [ ] Confirm create button is functional
- [ ] Test loading states work correctly

### Error Condition Testing
- [ ] Disconnect network and test operations
- [ ] Test with expired authentication
- [ ] Simulate server maintenance mode
- [ ] Test with malformed server responses

### Performance Testing
- [ ] Test with large datasets
- [ ] Monitor memory usage during extended use
- [ ] Test concurrent operations
- [ ] Validate pagination performance

### Browser Compatibility
- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Test on mobile devices

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] High contrast mode support
- [ ] Focus indicators visible

## Troubleshooting

### Common Test Failures

#### Authentication Errors in Tests
```
Error: Authentication required
```
**Solution**: Tests expect this error in test environment. This indicates auth checking is working correctly.

#### Mock Fetch Not Working
```
TypeError: fetch is not defined
```
**Solution**: Ensure global fetch is properly stubbed in test setup.

#### Test Timeout Issues
```
Error: Timeout of 2000ms exceeded
```
**Solution**: Increase timeout for integration tests or check for hanging promises.

### Debug Mode

Run tests with debug output:
```bash
DEBUG=legal-tag:* npm run test:legal-tags
```

### Coverage Reports

Generate coverage reports:
```bash
node test/scripts/runLegalTagTests.js --coverage
```

## Continuous Integration

### CI Pipeline Integration

Add to your CI configuration:

```yaml
# Example GitHub Actions
- name: Run Legal Tag Tests
  run: |
    npm install
    node test/scripts/runLegalTagTests.js --unit --integration
    
- name: Manual Test Report
  run: |
    node test/scripts/runLegalTagTests.js --manual > manual-test-guidance.txt
```

### Test Reporting

The test runner generates structured output suitable for CI systems:
- Exit codes indicate overall success/failure
- Detailed test results in standard format
- Manual test guidance for human testers

## Contributing

### Adding New Tests

1. **Unit Tests**: Add to `test/unit/legalTagDataFlow.test.ts`
2. **Integration Tests**: Add to `test/integration/legalTagEndToEndFlow.test.ts`
3. **Manual Scenarios**: Add to `test/manual/legalTagManualTestScenarios.test.ts`

### Test Naming Conventions

- Use descriptive test names: `should handle empty listLegalTags response`
- Group related tests in `describe` blocks
- Use `it.skip()` for temporarily disabled tests
- Mark manual tests with `MANUAL:` prefix

### Mock Data Guidelines

- Use realistic data that matches production
- Include edge cases (empty, null, malformed)
- Test both success and error scenarios
- Maintain consistency across test files

## Requirements Traceability

This testing suite addresses the following requirements:

- **4.1**: Legal tag creation and storage validation
- **4.2**: Legal tag retrieval from correct data source
- **4.3**: Frontend request/response format validation
- **4.4**: GraphQL resolver and database mapping validation

Each test includes requirement references in comments for traceability.