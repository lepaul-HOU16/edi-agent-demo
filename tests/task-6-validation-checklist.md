# Task 6 Validation Checklist

## Manual Testing Guide

### Test 1: Open Query Builder
- [ ] Navigate to catalog page
- [ ] Look for settings icon button in chat controls (left of input field)
- [ ] Click settings icon
- [ ] Verify query builder modal opens
- [ ] Verify modal has proper styling and overlay

### Test 2: Build and Execute Simple Query
- [ ] Select "Wells by Operator" template
- [ ] Enter "Shell" as operator value
- [ ] Verify query preview shows: `data.operator = "Shell"`
- [ ] Verify "Execute Query" button is enabled (green checkmark)
- [ ] Click "Execute Query"
- [ ] Verify modal closes
- [ ] Verify user message appears in chat showing the query
- [ ] Verify loading indicator appears
- [ ] Verify AI message appears with results
- [ ] Verify results use OSDUSearchResponse component format
- [ ] Verify record count is displayed
- [ ] Verify data table shows results

### Test 3: Map Integration
- [ ] Execute a query with georeferenced wells
- [ ] Switch to Map panel (first icon)
- [ ] Verify wells appear on map
- [ ] Verify well markers are clickable
- [ ] Verify well details show in popup

### Test 4: Analysis Panel Integration
- [ ] Execute a query
- [ ] Switch to Analysis panel (second icon)
- [ ] Verify analysis data is displayed
- [ ] Verify visualizations render

### Test 5: Chat Context Preservation
- [ ] Execute a query
- [ ] Verify results appear in chat
- [ ] Scroll up in chat
- [ ] Verify auto-scroll works when new messages arrive
- [ ] Verify chat history is preserved
- [ ] Verify you can scroll through previous messages

### Test 6: Error Handling
- [ ] Build a query with invalid criteria (empty values)
- [ ] Verify "Execute Query" button is disabled
- [ ] Verify validation errors show red badges
- [ ] Fix validation errors
- [ ] Verify button becomes enabled
- [ ] Execute query
- [ ] If API error occurs, verify error message displays in chat

### Test 7: Complex Query
- [ ] Add multiple criteria (3+)
- [ ] Use different operators (=, >, <, LIKE)
- [ ] Mix AND/OR logic
- [ ] Verify query preview updates correctly
- [ ] Verify query executes successfully
- [ ] Verify results match criteria

### Test 8: Query Builder Button Visibility
- [ ] Verify settings icon appears in chat controls
- [ ] Verify icon is properly styled
- [ ] Verify icon has tooltip/aria-label
- [ ] Verify clicking icon opens modal

### Test 9: Modal Behavior
- [ ] Open query builder
- [ ] Click outside modal (on overlay)
- [ ] Verify modal closes
- [ ] Open query builder again
- [ ] Click "Close" button
- [ ] Verify modal closes
- [ ] Verify state is preserved when reopening

### Test 10: Performance
- [ ] Execute a query
- [ ] Note execution time in console logs
- [ ] Verify execution completes in < 2 seconds
- [ ] Verify no AI agent calls in network tab
- [ ] Verify direct OSDU API call in network tab

## Expected Console Logs

When executing a query, you should see:
```
🔧 Query Builder: Executing structured query
✅ Query Builder: Query executed
📊 Parsed OSDU data
💾 Saved OSDU context
```

## Success Criteria

All checkboxes above should be checked for task to be considered validated.

## Known Limitations

- Query builder requires OSDU API to be configured
- Results depend on available OSDU data
- Map display requires georeferenced wells (latitude/longitude)
- Some OSDU records may not have coordinates

## Troubleshooting

### Query Builder Doesn't Open
- Check console for errors
- Verify `showQueryBuilder` state is working
- Verify modal rendering logic

### No Results Displayed
- Check network tab for OSDU API call
- Verify API response in console
- Check for parsing errors
- Verify OSDUSearchResponse component is rendering

### Map Not Updating
- Verify wells have latitude/longitude
- Check `mapComponentRef.current` exists
- Verify `updateMapData` is called
- Check map panel is selected

### Results Not in Chat
- Verify `setMessages` is called
- Check message format matches expected structure
- Verify OSDUSearchResponse component renders
- Check for React rendering errors
