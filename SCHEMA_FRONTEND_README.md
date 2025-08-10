# Schema Frontend Implementation

This document describes the implementation of the enhanced schema features for the UXPin frontend, including semantic search interface and improved schema browsing experience.

## Overview

The implementation adds comprehensive schema management capabilities to the existing UXPin frontend, including:

1. **Semantic Search Interface** - AI-powered schema discovery
2. **Enhanced Schema Browsing** - Improved navigation and recommendations
3. **Integration Testing** - Comprehensive testing of all features

## Components Implemented

### Core Pages

- **`/schemas`** - Main schema listing and search page
- **`/schemas/[id]`** - Detailed schema view with related schemas
- **`/test-schemas`** - Integration testing page (development only)

### Components

#### Schema Display Components
- **`SchemaCard`** - Individual schema display with similarity scores
- **`SchemaFilters`** - Advanced filtering interface
- **`RelatedSchemas`** - AI-powered related schema recommendations
- **`SchemaVersionHistory`** - Version tracking and comparison

#### Search Components
- **`SemanticSchemaSearch`** - AI-powered semantic search interface
- **`SchemaSearchSuggestions`** - Auto-complete and search suggestions

#### Testing Components
- **`SchemaIntegrationTester`** - Automated integration testing utility
- **`SchemaIntegration.test.tsx`** - Unit and integration tests

## Features

### 1. Semantic Search Interface

**Location**: `/schemas` page, "Semantic Search" tab

**Features**:
- AI-powered query analysis and insights
- Natural language search queries
- Similarity scoring and ranking
- Search strategy explanations
- Fallback to traditional search

**Usage**:
```typescript
// Example semantic search
const results = await osduApi.searchSchemasBySimilarity('well data schemas', 10);
```

### 2. Enhanced Schema Browsing

**Features**:
- Related schema recommendations
- Schema similarity analysis
- Visual relationship indicators
- Auto-complete search suggestions
- Category-based filtering

**Components**:
- Schema cards with expandable details
- Similarity scores and confidence indicators
- Related schema sections
- Version history tracking

### 3. Schema Detail Pages

**Location**: `/schemas/[id]`

**Features**:
- Complete schema information display
- Related schemas with AI analysis
- Version history and comparison
- Download and sharing capabilities
- Tabbed interface for different views

### 4. Search Suggestions

**Features**:
- Recent search history
- Popular search terms
- Entity type suggestions
- Semantic search recommendations
- Context-aware suggestions

## API Integration

### OSDU API Service Extensions

The `osduApiService.js` has been extended with new methods:

```javascript
// Semantic search
await osduApi.searchSchemasBySimilarity(query, k);

// Related schemas
await osduApi.findRelatedSchemas(schemaId, k);

// Embedding statistics
await osduApi.getSchemaEmbeddingStats();
```

### Mock Implementation

Currently uses mock implementations that:
- Simulate AI-powered similarity analysis
- Generate realistic similarity scores
- Provide fallback to regular search
- Handle error cases gracefully

## Testing

### Automated Testing

**Location**: `src/utils/testSchemaIntegration.ts`

**Tests**:
- Schema loading verification
- Semantic search functionality
- Related schemas discovery
- Error handling and loading states

**Usage**:
```typescript
const tester = new SchemaIntegrationTester();
const results = await tester.runAllTests();
```

### Manual Testing

**Location**: `/test-schemas` page

**Features**:
- API connection verification
- Sample schema display
- Manual feature testing
- Integration test execution
- Results visualization

### Unit Tests

**Location**: `src/components/__tests__/SchemaIntegration.test.tsx`

**Coverage**:
- Component rendering
- User interactions
- Error handling
- Accessibility compliance

## Configuration

### Environment Variables

The frontend uses environment variables from `.env.local`:

```bash
# Schema API Configuration
VITE_SCHEMA_API_URL=https://your-schema-api.amazonaws.com/graphql
VITE_SCHEMA_API_KEY=your-api-key

# Authentication
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
```

### Theme Integration

All components use the existing Material-UI theme:
- Consistent color schemes
- Responsive design
- Dark/light mode support
- Accessibility compliance

## Usage Examples

### Basic Schema Search

```typescript
// Traditional search
const schemas = await osduApi.listSchemas('osdu', { 
  entityType: 'WellboreMarker' 
});

// Semantic search
const results = await osduApi.searchSchemasBySimilarity(
  'drilling and completion data', 
  10
);
```

### Related Schema Discovery

```typescript
// Find related schemas
const related = await osduApi.findRelatedSchemas(schemaId, 5);

// Process results
related.findRelatedSchemas.results.forEach(result => {
  console.log(`${result.schema.schemaIdentity.entityType}: ${result.similarity}`);
});
```

### Component Usage

```tsx
// Schema card with similarity
<SchemaCard 
  schema={schema}
  similarity={0.85}
  onViewDetails={(schema) => router.push(`/schemas/${schema.id}`)}
/>

// Semantic search interface
<SemanticSchemaSearch
  onResults={setSemanticResults}
  searchQuery={searchQuery}
  loading={loading}
/>
```

## Error Handling

### API Errors
- Graceful fallback to regular search
- User-friendly error messages
- Retry mechanisms
- Loading state management

### UI Errors
- Component error boundaries
- Validation feedback
- Accessibility compliance
- Progressive enhancement

## Performance Considerations

### Optimization Strategies
- Lazy loading of components
- Debounced search inputs
- Cached API responses
- Efficient re-rendering

### Loading States
- Skeleton screens
- Progress indicators
- Incremental loading
- Error recovery

## Accessibility

### Compliance Features
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus management

### Testing
- Automated accessibility tests
- Manual keyboard testing
- Screen reader verification
- Color blindness testing

## Future Enhancements

### Planned Features
1. Real vector search integration
2. Advanced schema comparison
3. Bulk schema operations
4. Schema validation tools
5. Export/import capabilities

### Backend Integration
- Vector embedding service
- Real-time similarity calculation
- Advanced filtering options
- Performance optimization

## Deployment

### Development
```bash
cd frontend-uxpin
npm run dev
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
# Visit /test-schemas page
```

### Production
```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check environment variables
   - Verify authentication
   - Test API endpoints

2. **Search Not Working**
   - Verify schema data exists
   - Check API responses
   - Review error logs

3. **UI Components Not Loading**
   - Check component imports
   - Verify theme provider
   - Review console errors

### Debug Tools

- Browser developer tools
- Network tab for API calls
- Console logs for errors
- React DevTools for components

## Support

For issues or questions:
1. Check the test page at `/test-schemas`
2. Review browser console logs
3. Verify API connectivity
4. Check component error boundaries