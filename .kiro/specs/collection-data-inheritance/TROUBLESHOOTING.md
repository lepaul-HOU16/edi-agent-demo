# Collection Data Inheritance - Troubleshooting Guide

## Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

- [ ] Is the user authenticated? (Check Cognito token)
- [ ] Does the collection exist? (Check DynamoDB Collections table)
- [ ] Does the session exist? (Check DynamoDB Sessions table)
- [ ] Are API endpoints responding? (Check API Gateway logs)
- [ ] Are Lambda functions healthy? (Check CloudWatch metrics)
- [ ] Is DynamoDB accessible? (Check service health)
- [ ] Is the cache working? (Check cache hit/miss ratio)

---

## Common Issues

### 1. Collection Context Not Loading

#### Symptoms
- Canvas opens but no collection alert displayed
- FileDrawer is empty
- AI agents don't know about collection data
- Browser console shows errors

#### Possible Causes

**A. Session Missing linkedCollectionId**

Check session record in DynamoDB:
```bash
aws dynamodb get-item \
  --table-name Sessions-production \
  --key '{"id": {"S": "session_xyz789"}}'
```

Look for `linkedCollectionId` field. If missing:
- Session was created without collection link
- Session was updated incorrectly
- Database corruption

**Solution**:
```typescript
// Update session with collection link
await updateSession(sessionId, {
  linkedCollectionId: 'collection_abc123'
});
```

**B. Collection Deleted**

Check if collection exists:
```bash
aws dynamodb get-item \
  --table-name Collections-production \
  --key '{"id": {"S": "collection_abc123"}}'
```

If not found:
- Collection was deleted
- Collection ID is incorrect
- Database issue

**Solution**:
- Show broken link warning to user
- Offer to remove link
- User can create new canvas from different collection

**C. API Call Failing**

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/sessions-handler --follow --no-cli-pager
```

Look for errors like:
- `Session not found`
- `DynamoDB unavailable`
- `Timeout`

**Solution**:
- Retry the API call
- Check Lambda function health
- Verify DynamoDB table exists
- Check IAM permissions

**D. Frontend Not Calling API**

Check browser console:
```javascript
// Should see API calls like:
GET /api/sessions/session_xyz789
GET /api/collections/collection_abc123
```

If missing:
- Frontend code not executing
- React component not mounting
- State management issue

**Solution**:
- Check React DevTools for component state
- Verify useEffect dependencies
- Check for JavaScript errors

---

### 2. Files Not Appearing in FileDrawer

#### Symptoms
- Collection context alert shows correctly
- FileDrawer opens but is empty
- Well files not accessible
- AI can't access file contents

#### Possible Causes

**A. Collection Has No S3 Data Items**

Check collection data:
```bash
aws dynamodb get-item \
  --table-name Collections-production \
  --key '{"id": {"S": "collection_abc123"}}'
```

Look at `dataItems` array. Each item should have `s3Key`:
```json
{
  "dataItems": [
    {
      "id": "well_001",
      "s3Key": "global/well-data/WELL-001.las"
    }
  ]
}
```

If `s3Key` is missing:
- Collection created from OSDU data (no S3 files)
- Data items don't have file paths
- Collection created incorrectly

**Solution**:
- Verify data source type
- OSDU collections don't have files in FileDrawer
- Recreate collection from S3 data

**B. S3 Bucket Permissions**

Check if Lambda can access S3:
```bash
aws s3 ls s3://your-bucket/global/well-data/
```

If access denied:
- Lambda IAM role missing S3 permissions
- Bucket policy blocking access
- Bucket doesn't exist

**Solution**:
```json
// Add to Lambda IAM role
{
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::your-bucket/*",
    "arn:aws:s3:::your-bucket"
  ]
}
```

**C. FileDrawer Not Receiving Context**

Check React props:
```typescript
// In ChatPage.tsx
console.log('Collection context:', collectionContext);
console.log('File paths:', getWellFilePaths(collectionContext));
```

If undefined:
- Context not loaded
- Props not passed correctly
- Component not re-rendering

**Solution**:
- Verify context loading in useEffect
- Check prop drilling path
- Force re-render with key prop

---

### 3. AI Not Recognizing Collection Data

#### Symptoms
- AI asks "which wells?" when you say "my wells"
- AI doesn't use collection context
- AI can't find data you know is in collection
- AI gives generic responses

#### Possible Causes

**A. Context Not Passed to AI Agent**

Check agent prompt construction:
```typescript
// Should include collection context
const prompt = buildAgentPrompt({
  userMessage: message,
  collectionContext: collectionContext,
  wellList: getWellFilePaths(collectionContext)
});
```

If context missing:
- Prompt builder not including context
- Context not available when building prompt
- Agent configuration issue

**Solution**:
```typescript
// Ensure context passed to agent
if (collectionContext) {
  prompt += `\n\nAvailable wells: ${collectionContext.dataItems.map(w => w.name).join(', ')}`;
  prompt += `\nCollection: ${collectionContext.name}`;
  prompt += `\nWell count: ${collectionContext.wellCount}`;
}
```

**B. Agent Prompt Too Long**

Check prompt length:
```typescript
console.log('Prompt length:', prompt.length);
```

If > 10,000 characters:
- Context being truncated
- Agent not seeing full context
- Token limit exceeded

**Solution**:
- Summarize collection context
- Only include essential information
- Use shorter well names

**C. Agent Configuration Issue**

Check agent system prompt:
```typescript
// Agent should be configured to use context
systemPrompt: `You are a petrophysical analysis assistant.
When the user refers to "my wells" or "the collection", use the provided collection context.
Available wells: ${wellList}`
```

If not configured:
- Agent doesn't know to use context
- System prompt missing instructions
- Agent needs retraining

**Solution**:
- Update agent system prompt
- Include context usage instructions
- Test with explicit well names first

---

### 4. Canvas Performance Issues

#### Symptoms
- Canvas takes long time to load
- Collection context loads slowly
- FileDrawer slow to open
- UI feels sluggish

#### Possible Causes

**A. Large Collection**

Check collection size:
```bash
aws dynamodb get-item \
  --table-name Collections-production \
  --key '{"id": {"S": "collection_abc123"}}'
```

Count `dataItems` array length. If > 50:
- Large collections take longer to load
- More data to transfer
- More files to list

**Solution**:
- Split into smaller collections
- Use pagination for file listing
- Implement lazy loading
- Cache more aggressively

**B. Cache Not Working**

Check cache metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace CollectionInheritance \
  --metric-name CacheHitRatio \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 3600 \
  --statistics Average
```

If hit ratio < 50%:
- Cache not being used
- Cache TTL too short
- Cache invalidation too aggressive

**Solution**:
```typescript
// Increase cache TTL
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Check cache before fetching
const cached = getFromCache(collectionId);
if (cached && !isCacheExpired(cached)) {
  return cached.data;
}
```

**C. DynamoDB Throttling**

Check CloudWatch metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=Sessions-production \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 300 \
  --statistics Sum
```

If throttled requests > 0:
- Read/write capacity too low
- Burst capacity exhausted
- Hot partition key

**Solution**:
- Increase DynamoDB capacity
- Use on-demand billing
- Implement exponential backoff
- Add caching layer

---

### 5. Broken Collection Links

#### Symptoms
- Warning alert: "Collection Unavailable"
- Collection name shows with warning icon
- FileDrawer empty
- AI doesn't have context

#### Possible Causes

**A. Collection Deleted**

Check if collection exists:
```bash
aws dynamodb get-item \
  --table-name Collections-production \
  --key '{"id": {"S": "collection_abc123"}}'
```

If not found:
- User deleted collection
- Admin deleted collection
- Database cleanup removed it

**Solution**:
- Show broken link warning (already implemented)
- Offer "Remove Link" button
- User can continue using canvas without collection

**B. Collection Access Revoked**

Check collection owner:
```bash
aws dynamodb get-item \
  --table-name Collections-production \
  --key '{"id": {"S": "collection_abc123"}}'
```

Compare `owner` field with current user. If different:
- Collection shared then unshared
- Permissions changed
- User account changed

**Solution**:
- Implement proper access control
- Check permissions before loading
- Show appropriate error message

**C. Database Corruption**

Check session record:
```bash
aws dynamodb get-item \
  --table-name Sessions-production \
  --key '{"id": {"S": "session_xyz789"}}'
```

If `linkedCollectionId` points to non-existent collection:
- Data integrity issue
- Manual database edit
- Migration error

**Solution**:
- Implement referential integrity checks
- Add database validation
- Clean up orphaned references

---

### 6. Session Not Persisting

#### Symptoms
- Create canvas, close browser, reopen - session gone
- Canvas works but doesn't remember collection link
- Have to recreate canvas every time

#### Possible Causes

**A. Session Not Saved to DynamoDB**

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/sessions-handler --follow --no-cli-pager
```

Look for:
```
Creating session: session_xyz789
DynamoDB put-item: success
```

If missing:
- Lambda not writing to DynamoDB
- DynamoDB write failing
- IAM permissions issue

**Solution**:
```typescript
// Verify DynamoDB write
const params = {
  TableName: 'Sessions-production',
  Item: {
    id: sessionId,
    name: name,
    linkedCollectionId: linkedCollectionId,
    owner: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

await dynamodb.put(params).promise();
console.log('Session saved:', sessionId);
```

**B. Frontend Using Wrong Session ID**

Check browser localStorage:
```javascript
// In browser console
console.log(localStorage.getItem('currentSessionId'));
```

If undefined or wrong:
- Session ID not stored
- localStorage cleared
- Wrong key used

**Solution**:
```typescript
// Store session ID after creation
const session = await createSession(data);
localStorage.setItem('currentSessionId', session.sessionId);
navigate(`/chat/${session.sessionId}`);
```

**C. Lambda Cold Start Issue**

Check Lambda metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=sessions-handler \
  --start-time 2024-01-15T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum
```

If cold start > 3 seconds:
- Lambda taking too long to initialize
- DynamoDB connection slow
- Dependencies loading slowly

**Solution**:
- Keep Lambda warm with CloudWatch Events
- Reduce Lambda package size
- Use Lambda layers for dependencies
- Implement connection pooling

---

## Debugging Tools

### CloudWatch Logs

**Sessions Lambda**:
```bash
aws logs tail /aws/lambda/sessions-handler --follow --no-cli-pager
```

**Collections Lambda**:
```bash
aws logs tail /aws/lambda/collections-handler --follow --no-cli-pager
```

**Filter by error**:
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/sessions-handler \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

### DynamoDB Queries

**Get session**:
```bash
aws dynamodb get-item \
  --table-name Sessions-production \
  --key '{"id": {"S": "session_xyz789"}}'
```

**List user sessions**:
```bash
aws dynamodb query \
  --table-name Sessions-production \
  --index-name owner-createdAt-index \
  --key-condition-expression "owner = :owner" \
  --expression-attribute-values '{":owner": {"S": "user@example.com"}}'
```

**Get collection**:
```bash
aws dynamodb get-item \
  --table-name Collections-production \
  --key '{"id": {"S": "collection_abc123"}}'
```

### API Gateway Testing

**Test session creation**:
```bash
curl -X POST https://api.your-domain.com/api/sessions/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Canvas", "linkedCollectionId": "collection_abc123"}'
```

**Test session retrieval**:
```bash
curl https://api.your-domain.com/api/sessions/session_xyz789 \
  -H "Authorization: Bearer $TOKEN"
```

### Browser DevTools

**Check API calls**:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "api"
4. Look for sessions/collections requests
5. Check status codes and responses

**Check React state**:
1. Install React DevTools extension
2. Open Components tab
3. Find ChatPage component
4. Inspect collectionContext state
5. Verify data is loaded

**Check console errors**:
1. Open Console tab
2. Look for red error messages
3. Check for API failures
4. Verify no JavaScript errors

---

## Error Messages Reference

### Frontend Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Failed to load session" | Session doesn't exist | Check session ID, verify DynamoDB |
| "Collection not found" | Collection deleted | Show broken link warning |
| "Failed to load collection context" | API failure | Retry, check Lambda logs |
| "No files available" | Collection has no S3 data | Verify data source type |
| "Session creation failed" | DynamoDB write error | Check IAM permissions |

### Backend Errors

| Error Code | Message | Cause | Solution |
|-----------|---------|-------|----------|
| 400 | "Invalid request" | Missing required fields | Check request body |
| 401 | "Unauthorized" | Invalid auth token | Refresh Cognito token |
| 403 | "Forbidden" | User doesn't own resource | Check ownership |
| 404 | "Session not found" | Session doesn't exist | Verify session ID |
| 404 | "Collection not found" | Collection deleted | Handle broken link |
| 429 | "Rate limit exceeded" | Too many requests | Implement backoff |
| 500 | "Internal server error" | Lambda failure | Check CloudWatch logs |
| 503 | "Service unavailable" | DynamoDB down | Wait and retry |

---

## Performance Optimization

### Reduce Load Times

1. **Enable caching**:
   ```typescript
   const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
   ```

2. **Lazy load file list**:
   ```typescript
   // Only load files when FileDrawer opens
   const [files, setFiles] = useState([]);
   const loadFiles = async () => {
     if (files.length === 0) {
       const paths = getWellFilePaths(collectionContext);
       setFiles(paths);
     }
   };
   ```

3. **Paginate large collections**:
   ```typescript
   // Load 20 wells at a time
   const PAGE_SIZE = 20;
   const [page, setPage] = useState(0);
   const visibleWells = dataItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
   ```

### Reduce API Calls

1. **Batch requests**:
   ```typescript
   // Load session and collection in parallel
   const [session, collection] = await Promise.all([
     getSession(sessionId),
     getCollection(collectionId)
   ]);
   ```

2. **Cache in React state**:
   ```typescript
   const [collectionContext, setCollectionContext] = useState(null);
   
   useEffect(() => {
     if (!collectionContext && session.linkedCollectionId) {
       loadContext();
     }
   }, [session]);
   ```

3. **Debounce updates**:
   ```typescript
   const debouncedUpdate = debounce(async (data) => {
     await updateSession(sessionId, data);
   }, 1000);
   ```

---

## Monitoring and Alerts

### Key Metrics to Watch

1. **API Error Rate**
   - Target: < 1%
   - Alert if > 5%

2. **Session Retrieval Latency**
   - Target: < 200ms
   - Alert if > 1 second

3. **Collection Context Load Time**
   - Target: < 500ms
   - Alert if > 2 seconds

4. **Cache Hit Ratio**
   - Target: > 70%
   - Alert if < 50%

5. **DynamoDB Throttling**
   - Target: 0 throttled requests
   - Alert if > 10 per hour

### CloudWatch Alarms

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name sessions-high-error-rate \
  --alarm-description "Alert when session API error rate > 5%" \
  --metric-name APIErrorRate \
  --namespace CollectionInheritance \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# High latency alarm
aws cloudwatch put-metric-alarm \
  --alarm-name sessions-high-latency \
  --alarm-description "Alert when session retrieval > 1 second" \
  --metric-name SessionRetrievalLatency \
  --namespace CollectionInheritance \
  --statistic Average \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Getting Help

### Before Contacting Support

1. Check this troubleshooting guide
2. Review CloudWatch logs
3. Check browser console
4. Verify DynamoDB tables exist
5. Test API endpoints directly
6. Check IAM permissions

### Information to Provide

When contacting support, include:
- Session ID
- Collection ID
- User email
- Timestamp of issue
- Error messages (exact text)
- CloudWatch log excerpts
- Browser console errors
- Steps to reproduce

### Support Channels

- Technical documentation
- CloudWatch logs
- Support team contact
- GitHub issues (if applicable)

---

## Preventive Maintenance

### Regular Checks

1. **Weekly**:
   - Review CloudWatch metrics
   - Check error rates
   - Verify cache performance
   - Monitor DynamoDB capacity

2. **Monthly**:
   - Audit orphaned sessions
   - Clean up old data
   - Review IAM permissions
   - Update documentation

3. **Quarterly**:
   - Performance testing
   - Load testing
   - Security audit
   - Dependency updates

### Best Practices

1. **Always check success flags**:
   ```typescript
   const result = await getSession(sessionId);
   if (!result.success) {
     handleError(result.error);
     return;
   }
   ```

2. **Implement retry logic**:
   ```typescript
   const retryWithBackoff = async (fn, maxRetries = 3) => {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await sleep(Math.pow(2, i) * 1000);
       }
     }
   };
   ```

3. **Log everything**:
   ```typescript
   console.log('Loading session:', sessionId);
   console.log('Session loaded:', session);
   console.log('Loading collection:', collectionId);
   console.log('Collection loaded:', collection);
   ```

4. **Handle errors gracefully**:
   ```typescript
   try {
     await loadContext();
   } catch (error) {
     console.error('Failed to load context:', error);
     showErrorAlert('Unable to load collection data. Please try again.');
   }
   ```

---

## Summary

Most issues fall into these categories:
1. **Missing data** - Check DynamoDB tables
2. **API failures** - Check CloudWatch logs
3. **Permission issues** - Check IAM roles
4. **Performance problems** - Check metrics and caching
5. **Broken links** - Handle gracefully with warnings

**Always start with CloudWatch logs and DynamoDB queries to diagnose issues.**
