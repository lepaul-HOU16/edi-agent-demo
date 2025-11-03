# Unit Tests for Renewable Project Persistence

This directory contains comprehensive unit tests for the renewable energy project persistence system.

## Test Files

### 1. test-project-store.test.ts
Tests for the ProjectStore class (S3-based persistence).

**Coverage:**
- ✅ Save/load/list operations
- ✅ Data merging logic
- ✅ Partial name matching with fuzzy search
- ✅ Error handling and retry logic
- ✅ Caching behavior (5-minute TTL)
- ✅ S3 pagination
- ✅ Cache statistics

**Key Test Scenarios:**
- Saving new projects to S3
- Merging updates with existing data
- Loading projects from S3 and cache
- Listing all projects with pagination
- Finding projects by partial name
- Deleting projects
- Handling S3 errors gracefully
- Cache TTL expiration
- Retry logic with exponential backoff

### 2. test-project-name-generator.test.ts
Tests for the ProjectNameGenerator class.

**Coverage:**
- ✅ Location extraction from natural language queries
- ✅ Reverse geocoding using AWS Location Service
- ✅ Name normalization to kebab-case
- ✅ Uniqueness checking against existing projects
- ✅ Geocoding cache (24-hour TTL)

**Key Test Scenarios:**
- Extracting locations from various query patterns
- Generating names from coordinates
- Fallback to coordinate-based names
- Normalizing names (lowercase, hyphens, special chars)
- Appending numbers for uniqueness
- Caching geocoding results
- Handling edge cases (empty queries, special characters)

### 3. test-session-context-manager.test.ts
Tests for the SessionContextManager class (DynamoDB-based).

**Coverage:**
- ✅ Context creation and retrieval
- ✅ Active project tracking
- ✅ Project history management
- ✅ DynamoDB operations (Get, Put, Update)
- ✅ Caching behavior (5-minute TTL)
- ✅ TTL management (7-day expiration)

**Key Test Scenarios:**
- Loading existing context from DynamoDB
- Creating new context if not found
- Setting active project
- Adding projects to history
- Removing duplicates from history
- Limiting history size (max 10)
- Cache invalidation
- Fallback to cache on DynamoDB errors
- TTL updates on operations

### 4. test-project-resolver.test.ts
Tests for the ProjectResolver class.

**Coverage:**
- ✅ Explicit reference extraction
- ✅ Implicit reference resolution
- ✅ Partial name matching with fuzzy search
- ✅ Ambiguity detection and handling
- ✅ Confidence levels (explicit, implicit, partial, active, none)

**Key Test Scenarios:**
- Extracting explicit references ("for project X")
- Resolving implicit references ("that project", "continue")
- Matching partial names with Levenshtein distance
- Detecting ambiguous matches
- Falling back to active project
- Handling case-insensitive matching
- Cache management for project list

## Running Tests

### Run All Unit Tests
```bash
./tests/unit/run-unit-tests.sh
```

### Run Individual Test Files
```bash
# ProjectStore tests
npx jest tests/unit/test-project-store.test.ts --verbose

# ProjectNameGenerator tests
npx jest tests/unit/test-project-name-generator.test.ts --verbose

# SessionContextManager tests
npx jest tests/unit/test-session-context-manager.test.ts --verbose

# ProjectResolver tests
npx jest tests/unit/test-project-resolver.test.ts --verbose
```

### Run with Coverage
```bash
npx jest tests/unit/ --coverage
```

### Run in Watch Mode
```bash
npx jest tests/unit/ --watch
```

## Test Dependencies

The tests use the following mocking libraries:
- `aws-sdk-client-mock` - For mocking AWS SDK clients (S3, DynamoDB, Location)
- `jest` - Test framework
- `@types/jest` - TypeScript types for Jest

## Test Structure

Each test file follows this structure:

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks
    // Create fresh instances
    // Clear caches
  });

  describe('methodName()', () => {
    it('should do something', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Coverage Goals

Target coverage for each component:
- **Statements:** > 90%
- **Branches:** > 85%
- **Functions:** > 90%
- **Lines:** > 90%

## Mocking Strategy

### S3 Client
```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';

const s3Mock = mockClient(S3Client);
s3Mock.on(GetObjectCommand).resolves({ Body: ... });
```

### DynamoDB Client
```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoMock = mockClient(DynamoDBDocumentClient);
dynamoMock.on(GetCommand).resolves({ Item: ... });
```

### Location Client
```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { LocationClient } from '@aws-sdk/client-location';

const locationMock = mockClient(LocationClient);
locationMock.on(SearchPlaceIndexForPositionCommand).resolves({ Results: ... });
```

## Common Test Patterns

### Testing Cache Behavior
```typescript
// First call (from source)
await component.load('key');
expect(mockClient.commandCalls(GetCommand).length).toBe(1);

// Second call (from cache)
await component.load('key');
expect(mockClient.commandCalls(GetCommand).length).toBe(1); // Still 1
```

### Testing Error Handling
```typescript
mockClient.on(GetCommand).rejects(new Error('Service Error'));

const result = await component.load('key');

// Should handle error gracefully
expect(result).toBeDefined();
```

### Testing Retry Logic
```typescript
mockClient.on(PutCommand)
  .rejectsOnce({ name: 'ServiceUnavailable' })
  .resolves({});

await component.save('key', data);

// Should have retried
expect(mockClient.commandCalls(PutCommand).length).toBe(2);
```

## Troubleshooting

### Tests Fail with "Cannot find module"
```bash
npm install
```

### Tests Fail with AWS SDK Errors
Make sure you're using `aws-sdk-client-mock` correctly:
```bash
npm install --save-dev aws-sdk-client-mock
```

### Tests Timeout
Increase Jest timeout in test file:
```typescript
jest.setTimeout(10000); // 10 seconds
```

### Cache Issues in Tests
Always clear caches in `beforeEach`:
```typescript
beforeEach(() => {
  component.clearCache();
});
```

## Next Steps

After unit tests pass:
1. Run integration tests (task 14.5)
2. Run end-to-end tests (task 14.6-14.8)
3. Deploy to sandbox environment
4. Validate with real AWS services

## Related Documentation

- [ProjectStore Implementation](../../amplify/functions/shared/projectStore.ts)
- [ProjectNameGenerator Implementation](../../amplify/functions/shared/projectNameGenerator.ts)
- [SessionContextManager Implementation](../../amplify/functions/shared/sessionContextManager.ts)
- [ProjectResolver Implementation](../../amplify/functions/shared/projectResolver.ts)
- [Design Document](../../.kiro/specs/renewable-project-persistence/design.md)
- [Requirements Document](../../.kiro/specs/renewable-project-persistence/requirements.md)
