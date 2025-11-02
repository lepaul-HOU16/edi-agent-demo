# Error Handling Quick Test Guide

## Quick Manual Tests for Task 9 Implementation

### Test 1: localStorage Quota (2 minutes)

**Simulate quota exceeded:**
```javascript
// Open browser console on catalog page
// Fill localStorage to capacity
for (let i = 0; i < 1000; i++) {
  try {
    localStorage.setItem(`test_${i}`, 'x'.repeat(100000));
  } catch (e) {
    console.log('Quota reached at iteration', i);
    break;
  }
}

// Now try to send a message in chat
// Expected: Warning message about storage limit
```

**Cleanup:**
```javascript
// Clear test data
for (let i = 0; i < 1000; i++) {
  localStorage.removeItem(`test_${i}`);
}
```

### Test 2: Corrupted localStorage Data (1 minute)

**Simulate corrupted data:**
```javascript
// Open browser console on catalog page
const sessionId = localStorage.getItem('catalog_session_id');
localStorage.setItem(`catalog_messages_${sessionId}`, '{invalid json data');

// Refresh the page
// Expected: Warning about corrupted data, data cleared
```

### Test 3: S3 URL Expiration (1 minute)

**Test expired URL:**
1. Run a search query (e.g., "/getdata")
2. Wait 1+ hour (or manually expire the URL)
3. Refresh the page
4. **Expected:** Warning about expired URLs, guidance to run new search

**Quick test (without waiting):**
```javascript
// Modify S3 URL in localStorage to be invalid
const sessionId = localStorage.getItem('catalog_session_id');
const messages = JSON.parse(localStorage.getItem(`catalog_messages_${sessionId}`));
if (messages && messages.length > 0) {
  const lastMsg = messages[messages.length - 1];
  if (lastMsg.files && lastMsg.files.metadata) {
    lastMsg.files.metadata = 'https://invalid-url.s3.amazonaws.com/test';
    localStorage.setItem(`catalog_messages_${sessionId}`, JSON.stringify(messages));
  }
}

// Refresh the page
// Expected: S3 fetch error, warning message
```

### Test 4: Network Error (1 minute)

**Simulate network error:**
1. Open browser DevTools
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to send a search query
5. **Expected:** Network error message with troubleshooting

### Test 5: Filter Error (1 minute)

**Test filter on empty data:**
1. Open catalog page (fresh session)
2. Try a filter query: "wells with log curve data"
3. **Expected:** Graceful handling (no crash)

**Test filter with data:**
1. Run "/getdata" to load wells
2. Disconnect network (DevTools > Network > Offline)
3. Try filter: "wells deeper than 3000m"
4. **Expected:** Error message, original data still visible

### Test 6: Session Reset with Errors (1 minute)

**Test reset with localStorage errors:**
```javascript
// Make localStorage read-only (simulate error)
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => { throw new Error('Storage disabled'); },
    setItem: () => { throw new Error('Storage disabled'); },
    removeItem: () => { throw new Error('Storage disabled'); }
  }
});

// Try to reset session
// Expected: Reset works, errors logged but not shown to user
```

## Expected Results Summary

### ✅ All Tests Should:
- Never crash the application
- Show user-friendly error messages
- Provide actionable guidance
- Log detailed errors to console
- Allow user to continue working
- Preserve existing data when possible

### ❌ Tests Should NOT:
- Show technical error stack traces to users
- Block the user interface
- Lose user's existing data
- Require page refresh to recover
- Show multiple error messages for same issue

## Console Output Verification

### Good Error Logging Example:
```
❌ DATA RESTORATION: Error fetching metadata: Error: S3_URL_EXPIRED
📊 Error details: {
  errorName: "Error",
  errorMessage: "S3_URL_EXPIRED",
  url: "https://..."
}
⚠️ DATA RESTORATION: S3 URL expired - user needs to run new search
📊 URL expiration info: {
  message: "S3 signed URLs typically expire after 1 hour",
  action: "Run a new search to generate fresh URLs"
}
```

### User Message Example:
```
⚠️ Data Restoration Failed

Could not restore previous session data. This may be due to:

Common Causes:
- 🕐 Expired S3 signed URLs (URLs expire after 1 hour)
- 🌐 Network connectivity issues
- 💾 Corrupted session data

What You Can Do:
- ✅ Run a new search to generate fresh data
- ✅ Check your internet connection
- ✅ Try refreshing the page

💡 Your new searches will work normally - this only affects restoring old data.
```

## Quick Validation Checklist

Run through these in 10 minutes:

- [ ] localStorage quota error shows warning (Test 1)
- [ ] Corrupted data is cleared and warned (Test 2)
- [ ] Expired S3 URLs show helpful message (Test 3)
- [ ] Network errors provide troubleshooting (Test 4)
- [ ] Filter errors preserve original data (Test 5)
- [ ] Session reset works with errors (Test 6)
- [ ] No console errors in normal operation
- [ ] All error messages are user-friendly
- [ ] Application never crashes
- [ ] User can always continue working

## Automated Test Commands

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Check for console errors (if you have automated tests)
npm test -- catalog-error-handling

# Lint check
npm run lint src/app/catalog/page.tsx
```

## Success Criteria

✅ **Task 9 is complete when:**
1. All 6 manual tests pass
2. No TypeScript errors
3. No console errors in normal operation
4. User-friendly messages for all error types
5. Application never crashes from errors
6. User can continue working after any error

## Time Estimate

- **Quick validation:** 10 minutes
- **Thorough testing:** 30 minutes
- **Edge case exploration:** 1 hour

## Notes

- Test in multiple browsers (Chrome, Firefox, Safari)
- Test with different network conditions
- Test with browser privacy modes
- Test with browser extensions that block storage
- Test with very large datasets (100+ wells)

## Cleanup After Testing

```javascript
// Clear all test data
localStorage.clear();
sessionStorage.clear();

// Refresh page for clean state
location.reload();
```
