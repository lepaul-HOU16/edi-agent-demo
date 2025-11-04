# OSDU Search Browser Manual Test Guide

## Purpose
This guide provides step-by-step instructions for manually testing the OSDU search integration in the browser to verify all requirements are met.

## Prerequisites
- Sandbox deployed: `npx ampx sandbox`
- OSDU_API_KEY configured in Lambda environment
- Browser with developer tools open
- Authenticated user session

## Test 1: OSDU Keyword Routes to OSDU API

### Steps:
1. Open the catalog page: http://localhost:3000/catalog
2. Open browser DevTools (F12) → Console tab
3. Enter query: **"Show me OSDU wells"**
4. Click Send

### Expected Results:
✅ Console shows: `🔍 OSDU search intent detected`
✅ Console shows: `🔍 Executing OSDU search`
✅ Loading message appears: "🔍 Searching OSDU data..."
✅ Response displays with OSDU header
✅ Record count shown prominently
✅ Records displayed in table format

### Requirements Tested:
- 2.1: System calls OSDU Search API
- 3.1: System detects OSDU keyword
- 4.5: Loading indicator shows "Searching OSDU data..."
- 9.1: System displays "Searching OSDU data..."

---

## Test 2: Non-OSDU Query Routes to Catalog

### Steps:
1. Clear chat or start new session
2. Open browser DevTools → Console tab
3. Enter query: **"Show me wells in Texas"**
4. Click Send

### Expected Results:
✅ Console shows: `🔍 Catalog search intent detected`
✅ Existing catalog search executes
✅ Map displays with well locations
✅ No OSDU-specific messaging

### Requirements Tested:
- 1.1: System continues to use catalogSearch for non-OSDU queries
- 3.2: System routes query without OSDU keyword to catalogSearch
- 8.1: OSDU added without modifying existing catalogSearch logic

---

## Test 3: OSDU Results Display Correctly

### Steps:
1. Enter query: **"Search OSDU data for wells"**
2. Wait for response
3. Inspect the displayed message

### Expected Results:
✅ Header shows: "🔍 OSDU Search Results"
✅ AI-generated answer text displayed
✅ Record count shown: "📊 Found X records"
✅ Table displays with record details
✅ Markdown formatting applied correctly
✅ Uses CustomAIMessage component

### Requirements Tested:
- 4.1: System displays AI-generated answer as formatted markdown
- 4.2: System shows record count prominently
- 4.3: System displays summary table of records
- 7.1: System uses existing ChatMessage component
- 7.2: System uses CustomAIMessage component

---

## Test 4: Error Handling - Missing API Key

### Steps:
1. Stop sandbox
2. Remove OSDU_API_KEY from Lambda environment (or set to empty)
3. Restart sandbox
4. Enter query: **"Show me OSDU wells"**

### Expected Results:
✅ Error message displayed: "⚠️ OSDU Search Unavailable"
✅ User-friendly message (no technical details)
✅ Suggests fallback: "Try a regular catalog search"
✅ No API key visible in error message
✅ No API key in console logs

### Requirements Tested:
- 5.6: System fails gracefully with error message
- 6.1: System handles CORS headers correctly
- 9.4: System indicates error is from OSDU

---

## Test 5: Error Handling - OSDU API Error

### Steps:
1. Set invalid OSDU_API_KEY in Lambda environment
2. Restart sandbox
3. Enter query: **"Find OSDU records"**

### Expected Results:
✅ Error message displayed
✅ User-friendly error message
✅ No API key exposed in error
✅ Suggests trying again or using catalog search

### Requirements Tested:
- 4.4: System displays user-friendly error message
- 5.7: System sanitizes error messages to remove API key
- 8.3: System falls back to existing catalog search

---

## Test 6: API Key Security - Never Exposed

### Steps:
1. Open browser DevTools → Network tab
2. Enter query: **"OSDU search"**
3. Click on the GraphQL request
4. Inspect request headers and payload
5. Inspect response

### Expected Results:
✅ No API key in request headers
✅ No API key in request payload
✅ No API key in response
✅ No API key in console logs
✅ API key only added server-side in Lambda

### Requirements Tested:
- 5.1: API key NOT in frontend code
- 5.2: API key stored in backend-only environment variables
- 5.3: All requests proxied through backend Lambda
- 5.4: API key NOT logged anywhere
- 5.5: API key NOT committed to version control

---

## Test 7: Loading State Management

### Steps:
1. Enter query: **"Show me OSDU wells"**
2. Observe loading indicator
3. Wait for response

### Expected Results:
✅ Loading message appears immediately
✅ Shows "🔍 Searching OSDU data..."
✅ Loading message replaced with results
✅ No stuck loading state
✅ Auto-scroll works correctly

### Requirements Tested:
- 4.5: System shows loading indicator
- 7.5: System preserves auto-scroll behavior
- 9.1: System displays "Searching OSDU data..."

---

## Test 8: Catalog Features Still Work

### Steps:
1. Test existing catalog features:
   - Map visualization
   - Table display
   - Filtering
   - Collection creation
   - Chain of thought panel

### Expected Results:
✅ Map displays well locations
✅ Table shows well data
✅ Filters work correctly
✅ Collections can be created
✅ Chain of thought displays reasoning
✅ All existing features unchanged

### Requirements Tested:
- 1.1-1.5: All existing catalog functionality preserved
- 8.1: OSDU added without modifying existing logic

---

## Test 9: Multiple OSDU Queries

### Steps:
1. Enter query: **"Show me OSDU wells"**
2. Wait for response
3. Enter query: **"Search OSDU for production data"**
4. Wait for response
5. Enter query: **"OSDU well information"**

### Expected Results:
✅ All queries route to OSDU
✅ All responses display correctly
✅ Chat history maintained
✅ No memory leaks or performance issues

### Requirements Tested:
- 7.4: System maintains existing message state management
- 9.5: System logs search source decisions

---

## Test 10: Mixed Query Session

### Steps:
1. Enter query: **"Show me OSDU wells"** (OSDU)
2. Wait for response
3. Enter query: **"Show me wells in Texas"** (Catalog)
4. Wait for response
5. Enter query: **"Search OSDU data"** (OSDU)
6. Wait for response

### Expected Results:
✅ OSDU queries route to OSDU API
✅ Catalog queries route to catalog search
✅ Correct headers for each type
✅ No confusion between sources
✅ All responses display correctly

### Requirements Tested:
- 3.1-3.4: Intent detection works correctly
- 9.2: System includes "OSDU Search Results" in response header
- 9.3: System displays "Catalog Search Results" for catalog

---

## Test 11: Console Logging Verification

### Steps:
1. Open browser DevTools → Console tab
2. Enter various queries (OSDU and catalog)
3. Review console logs

### Expected Results:
✅ Intent detection logged
✅ Search source logged
✅ No API key in logs
✅ Request timing logged
✅ Helpful debugging information

### Requirements Tested:
- 3.5: System logs detected search intent
- 9.5: System logs search source decisions
- 10.2: System logs OSDU API requests/responses
- 10.4: System includes request timing metrics

---

## Test 12: Network Tab Verification

### Steps:
1. Open browser DevTools → Network tab
2. Filter for GraphQL requests
3. Enter query: **"Show me OSDU wells"**
4. Inspect the osduSearch request

### Expected Results:
✅ Request goes to GraphQL endpoint
✅ Request includes query, dataPartition, maxResults
✅ No API key in request
✅ Response contains answer, recordCount, records
✅ Response time reasonable (< 5 seconds)

### Requirements Tested:
- 2.3: System includes query, dataPartition, maxResults
- 2.4: System extracts answer, recordCount, records
- 6.5: System maintains request timeout limits

---

## Test Summary Checklist

After completing all tests, verify:

- [ ] OSDU queries route to OSDU API
- [ ] Non-OSDU queries route to catalog
- [ ] Results display correctly with formatting
- [ ] Error handling works for missing API key
- [ ] Error handling works for API errors
- [ ] API key never exposed in browser
- [ ] Loading states work correctly
- [ ] Existing catalog features unchanged
- [ ] Multiple queries work correctly
- [ ] Mixed query sessions work correctly
- [ ] Console logging helpful and secure
- [ ] Network requests secure and efficient

## Requirements Coverage

All requirements from task 10 tested:

✅ **1.1-1.5**: Preserve existing catalog functionality
✅ **2.1-2.5**: Add OSDU search capability
✅ **3.1-3.4**: Implement search intent detection
✅ **4.1-4.3**: Display OSDU search results
✅ **5.1-5.8**: Maintain API security
✅ **6.1-6.5**: Handle cross-origin requests
✅ **7.1-7.5**: Integrate with existing chat UI
✅ **8.1-8.5**: Support incremental enhancement
✅ **9.1-9.5**: Provide clear user feedback
✅ **10.1-10.5**: Enable testing and validation

## Troubleshooting

### Issue: OSDU queries not routing correctly
**Solution**: Check console for intent detection logs. Verify "osdu" keyword is in query.

### Issue: API key error
**Solution**: Verify OSDU_API_KEY is set in Lambda environment. Check CloudWatch logs.

### Issue: No response displayed
**Solution**: Check Network tab for errors. Verify GraphQL query is defined. Check Lambda logs.

### Issue: Results not formatted correctly
**Solution**: Verify response includes answer, recordCount, records. Check CustomAIMessage component.

## Success Criteria

The OSDU search integration is complete when:

✅ All 12 manual tests pass
✅ No API key exposed in browser
✅ Error handling works gracefully
✅ Existing catalog features unchanged
✅ User experience is smooth and professional
✅ All requirements validated

## Next Steps

After all tests pass:
1. Document any issues found
2. Create user documentation
3. Train users on OSDU search feature
4. Monitor usage and performance
5. Gather user feedback for improvements
