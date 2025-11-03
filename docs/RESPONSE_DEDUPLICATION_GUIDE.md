# Response Deduplication Guide

## Overview

The EDIcraft response deduplication system prevents duplicate messages from appearing in the chat interface. This guide explains how it works and how to use it.

## How It Works

### Content Hash Generation

Every response gets a unique hash based on its content:

```typescript
// Hash format: edicraft-{prefix}-{length}
const hash = generateContentHash(content);
// Example: "edicraft-MinecraftEnvironmentCleared-285"
```

The hash is:
- **Stable:** Same content always produces same hash
- **Unique:** Different content produces different hashes
- **Fast:** O(1) computation using substring and length

### DOM Tracking

Each rendered response has a `data-content-hash` attribute:

```html
<div data-content-hash="edicraft-MinecraftEnvironmentCleared-285">
  <!-- Response content -->
</div>
```

Before rendering, the system checks if this hash already exists in the DOM. If it does, rendering is skipped.

### Processing Lock

A processing lock prevents concurrent artifact processing:

```typescript
if (processingRef.current) {
  console.log('Already processing, skipping');
  return;
}
processingRef.current = true;
// ... process artifacts ...
processingRef.current = false;
```

## Components

### EDIcraftResponseComponent

Handles deduplication for EDIcraft text responses (clear, time lock, etc.)

**Features:**
- Generates stable content hash
- Adds `data-content-hash` attribute
- Tracks render count
- Logs duplicate detection

**Usage:**
```typescript
import { EDIcraftResponseComponent } from './messageComponents/EDIcraftResponseComponent';

<EDIcraftResponseComponent content={responseText} />
```

### EnhancedArtifactProcessor

Handles deduplication for artifact-based responses (terrain maps, layouts, etc.)

**Features:**
- Generates hash from artifact array
- Prevents concurrent processing
- Skips if hash exists in DOM
- Tracks render count

**Usage:**
```typescript
<EnhancedArtifactProcessor 
  rawArtifacts={artifacts}
  message={message}
  theme={theme}
  onSendMessage={onSendMessage}
/>
```

## Debug Logging

The system provides comprehensive logging:

### Render Tracking
```
🔄 EnhancedArtifactProcessor RENDER #1 for hash: artifact-xyz-123
🔄 EDIcraft response render #3 for hash: edicraft-abc-456
```

### Duplicate Detection
```
⚠️ EDIcraft response duplicate detected: edicraft-abc-456 (2 instances)
⚠️ Duplicate artifact render detected: artifact-xyz-123 (3 instances)
```

### Skip Decisions
```
⏭️ EnhancedArtifactProcessor: Content already rendered, skipping
⏭️ EnhancedArtifactProcessor: Already processing, skipping
⏭️ EnhancedArtifactProcessor: Skipping re-render, artifacts unchanged
```

## Testing

### Unit Tests

Run unit tests:
```bash
npm test -- tests/unit/test-response-deduplication.test.tsx
```

Tests cover:
- Content hash generation
- Duplicate detection
- Processing lock
- Data attributes
- Render tracking

### Integration Tests

Run integration tests:
```bash
npm test -- tests/integration/test-edicraft-response-deduplication.test.ts
```

Tests cover:
- Real-world scenarios
- Clear operation responses
- Artifact processing
- Concurrent processing
- Sequential processing

## Troubleshooting

### Duplicates Still Appearing

**Check:**
1. Is `data-content-hash` attribute present?
2. Are console logs showing duplicate detection?
3. Is content actually identical?

**Debug:**
```typescript
// Check DOM for existing hashes
const elements = document.querySelectorAll('[data-content-hash]');
console.log('Existing hashes:', Array.from(elements).map(el => 
  el.getAttribute('data-content-hash')
));
```

### Processing Lock Issues

**Check:**
1. Is `processingRef.current` being set correctly?
2. Is lock being released after processing?
3. Are errors preventing lock release?

**Debug:**
```typescript
// Add logging around lock
console.log('Lock status before:', processingRef.current);
processingRef.current = true;
// ... processing ...
processingRef.current = false;
console.log('Lock status after:', processingRef.current);
```

### Hash Collisions

**Rare but possible:**
- Two different responses with same first 100 chars and same length
- Solution: Increase prefix length or add checksum

**Debug:**
```typescript
// Check for collisions
const hash1 = generateContentHash(content1);
const hash2 = generateContentHash(content2);
if (hash1 === hash2 && content1 !== content2) {
  console.error('Hash collision detected!', { hash1, content1, content2 });
}
```

## Best Practices

### 1. Always Use Content Hash

When creating new response components, always add `data-content-hash`:

```typescript
<div data-content-hash={contentHash}>
  {/* Your content */}
</div>
```

### 2. Generate Stable Hashes

Use consistent hash generation:

```typescript
const contentHash = useMemo(() => {
  return generateContentHash(content);
}, [content]);
```

### 3. Track Render Count

For debugging, track render count:

```typescript
const renderCountRef = useRef(0);
renderCountRef.current += 1;
console.log(`Render #${renderCountRef.current}`);
```

### 4. Use Processing Lock

For async operations, use processing lock:

```typescript
const processingRef = useRef(false);

const process = async () => {
  if (processingRef.current) return;
  processingRef.current = true;
  try {
    // ... async work ...
  } finally {
    processingRef.current = false;
  }
};
```

### 5. Log Skip Decisions

Always log when skipping:

```typescript
if (shouldSkip) {
  console.log('⏭️ Skipping render, reason:', reason);
  return;
}
```

## Performance Considerations

### Hash Generation
- **Cost:** O(1) - substring and length operations
- **Memory:** Minimal - just the hash string
- **Frequency:** Once per render (memoized)

### DOM Queries
- **Cost:** O(n) where n = number of elements with data-content-hash
- **Frequency:** Once per render
- **Optimization:** Results are cached by React

### Processing Lock
- **Cost:** O(1) - simple boolean check
- **Memory:** Minimal - just the ref
- **Benefit:** Prevents expensive duplicate processing

## Migration Guide

### Adding Deduplication to New Components

1. **Import hash generator:**
```typescript
import { generateContentHash } from './EDIcraftResponseComponent';
```

2. **Generate hash:**
```typescript
const contentHash = useMemo(() => 
  generateContentHash(content), 
  [content]
);
```

3. **Add attribute:**
```typescript
<div data-content-hash={contentHash}>
  {/* Content */}
</div>
```

4. **Check for duplicates:**
```typescript
useEffect(() => {
  const existing = document.querySelectorAll(
    `[data-content-hash="${contentHash}"]`
  );
  if (existing.length > 1) {
    console.warn('Duplicate detected');
  }
}, [contentHash]);
```

## API Reference

### generateContentHash(content: string): string

Generates a stable content hash.

**Parameters:**
- `content` - The content to hash

**Returns:**
- Hash string in format `edicraft-{prefix}-{length}`

**Example:**
```typescript
const hash = generateContentHash('✅ **Test**');
// Returns: "edicraft-Test-10"
```

### data-content-hash Attribute

HTML attribute used to track rendered content.

**Format:** `edicraft-{prefix}-{length}` or `artifact-{prefix}-{length}`

**Usage:**
```html
<div data-content-hash="edicraft-MinecraftEnvironmentCleared-285">
```

**Query:**
```typescript
const elements = document.querySelectorAll('[data-content-hash="..."]');
```

## Support

For issues or questions:

1. Check console logs for deduplication messages
2. Run unit tests to verify functionality
3. Review this guide for troubleshooting steps
4. Check implementation in `EDIcraftResponseComponent.tsx` and `ChatMessage.tsx`

## Related Documentation

- [Task 7 Implementation Summary](../tests/TASK_7_RESPONSE_DEDUPLICATION_SUMMARY.md)
- [EDIcraft RCON Reliability Spec](../.kiro/specs/fix-edicraft-rcon-reliability/)
- [Unit Tests](../tests/unit/test-response-deduplication.test.tsx)
- [Integration Tests](../tests/integration/test-edicraft-response-deduplication.test.ts)
