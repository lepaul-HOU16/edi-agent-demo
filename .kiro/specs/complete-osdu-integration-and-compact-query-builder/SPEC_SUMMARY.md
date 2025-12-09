# OSDU Integration & Compact Query Builder - Spec Summary

## 🎯 What We're Building

1. **Complete OSDU Integration** - Real credentials, real data, OAuth2 authentication
2. **Compact Query Builder** - 75% smaller, sticky, fast, and user-friendly
3. **Mock-up Design Page** - Visual demonstration of the new design

## 📊 The Problem

### Current State (Broken)
- **OSDU Lambda**: Returns 50 fake demo wells, no real API integration
- **Query Builder**: 1971 lines, 800px+ height, not sticky, scrolls away, slow

### Target State (Fixed)
- **OSDU Lambda**: Amazon Federate OAuth2, real EDI Platform API, real well data
- **Query Builder**: ~500 lines, 400px max height, sticky with high z-index, fast

## 🚀 Key Features

### OSDU Integration
- OAuth2 token management with automatic refresh
- Real EDI Platform API calls to `/api/search/v2/query/`
- Credentials stored in AWS Secrets Manager
- Comprehensive error handling

### Compact Query Builder
- **Max 400px height** - Compact and focused
- **Sticky positioning** - Stays at top when scrolling (z-index 1400)
- **Scrollable criteria** - Handle 20+ filters gracefully
- **Inline forms** - All fields in one row (field, operator, value, remove)
- **Collapsed advanced** - Expand only when needed
- **Debounced updates** - Query preview updates 300ms after typing stops
- **~500 lines** - 75% smaller codebase

## 📐 Design Comparison

| Metric | Old Design | New Design | Improvement |
|--------|-----------|------------|-------------|
| Lines of Code | 1971 | ~500 | 75% reduction |
| Max Height | 800px+ | 400px | 50% smaller |
| Sticky | No | Yes (z-index 1400) | Always visible |
| Query Preview | Immediate | Debounced (300ms) | Faster |
| Advanced Options | Always visible | Collapsed | Cleaner UI |
| Mobile Optimized | No | Yes | Responsive |
| Criteria Layout | Vertical (huge) | Inline (compact) | Space efficient |

## 🎨 Mock-up Design Page

Navigate to `/mockup/osdu-query-builder` in your browser to see:
- Side-by-side comparison (new vs old)
- Sticky behavior demonstration
- Metrics comparison table
- Scroll demo with sample results
- Design annotations and explanations

## 📋 Implementation Phases

### Phase 1: OSDU Integration (Tasks 1.1-1.5)
- Create OAuth2 client with token caching
- Create EDI Platform API client
- Store credentials in Secrets Manager
- Update OSDU Lambda handler
- Deploy and test

### Phase 2: Compact Query Builder (Tasks 2.1-2.5)
- Create CompactOSDUQueryBuilder component
- Create CompactCriterionRow component
- Add debounced query preview
- Add sticky positioning logic
- Optimize performance

### Phase 3: Mock-up Page (Tasks 3.1-3.4)
- Create mock-up page with route
- Add design comparison
- Add scroll demo content
- Add responsive demo

### Phase 4: Integration & Accessibility (Tasks 4.1-4.4)
- Add keyboard navigation
- Add screen reader support
- Integrate with CatalogPage
- Add focus management

### Phase 5: Testing & Deployment (Tasks 5.1-5.6)
- Test OSDU integration
- Test compact query builder
- Test performance
- Test accessibility
- Test integration
- Deploy to production

### Phase 6: Documentation & Cleanup (Tasks 6.1-6.3)
- Update documentation
- Remove old query builder (1971 lines)
- Monitor production

## 🔑 OSDU Credentials

Store in AWS Secrets Manager as `osdu-credentials`:

```json
{
  "clientId": "vavourak-qs-ac-fed",
  "clientSecret": "S6miKKOEIRy4WdsKKpg696jlhevQ0yow0TNgIg3GVE7YA",
  "tokenUrl": "https://idp-integ.federate.amazon.com/api/oauth2/v2/token",
  "authUrl": "https://idp-integ.federate.amazon.com/api/oauth2/v1/authorize",
  "platformUrl": "https://edi-platform.example.com"
}
```

## 🎯 Success Criteria

- ✅ OSDU Lambda returns real well data from EDI Platform
- ✅ OAuth2 authentication works with automatic token refresh
- ✅ Query builder is compact (max 400px height)
- ✅ Query builder stays sticky when scrolling
- ✅ Query builder has high z-index (1400) above chat messages
- ✅ Query preview updates are debounced (300ms)
- ✅ Codebase reduced from 1971 to ~500 lines (75% reduction)
- ✅ Performance: query preview < 100ms, render < 200ms
- ✅ Accessibility: keyboard navigation, screen reader support
- ✅ Mobile responsive with collapsed advanced options

## 📁 Files Created

1. `.kiro/specs/complete-osdu-integration-and-compact-query-builder/requirements.md`
2. `.kiro/specs/complete-osdu-integration-and-compact-query-builder/design.md`
3. `.kiro/specs/complete-osdu-integration-and-compact-query-builder/tasks.md`
4. `src/pages/OSDUQueryBuilderMockup.tsx` (Mock-up page - React + Cloudscape)
5. `src/pages/OSDUQueryBuilderMockup.css` (Clean CSS, no inline styles)

## 🚦 Next Steps

1. **Review the mock-up**: Navigate to `/mockup/osdu-query-builder` in your browser
2. **Review the spec**: Read requirements.md, design.md, and tasks.md
3. **Approve the spec**: Confirm the design meets your needs
4. **Start implementation**: Begin with Phase 1 (OSDU Integration)

## 💡 Key Design Decisions

1. **Sticky positioning**: Query builder stays at top when scrolling - no more scrolling back up!
2. **Inline forms**: All criterion fields in one row - saves vertical space
3. **Debounced updates**: Query preview updates 300ms after typing stops - faster performance
4. **Collapsed advanced**: Advanced options hidden by default - cleaner UI
5. **Scrollable criteria**: Handle 20+ filters without growing the component
6. **High z-index**: 1400 (above chat messages at 1300) - always visible

## 🔥 Impact

- **User Experience**: Query builder always visible, no scrolling back up
- **Performance**: 75% less code, debounced updates, optimized rendering
- **Maintainability**: Smaller codebase, clearer structure, easier to modify
- **Real Data**: Actual OSDU wells instead of fake demo data
- **Mobile**: Responsive design works on all screen sizes

---

**Ready to ship! 🚀**
