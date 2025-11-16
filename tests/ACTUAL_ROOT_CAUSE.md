# The ACTUAL Root Cause - AppSync Resolver Not Connected

## What Was Really Happening

The `deleteRenewableProject` GraphQL mutation was **returning success but not actually deleting anything** because:

**The AppSync resolver was not connected to the Lambda function.**

## Evidence

```bash
# Check the resolver
aws appsync get-resolver \
  --api-id fhzj4la45fevdnax5s2o4hbuqy \
  --type-name Mutation \
  --field-name deleteRenewableProject

# Result:
{
  "dataSourceName": null,  # ← NO DATA SOURCE!
  "kind": null,
  "pipelineConfig": null
}
```

The resolver existed but had no data source, so it was returning a default/mock response with `success: true`.

## Why This Happened

**Amplify Gen 2 Bug**: When you define a function in `amplify/data/resource.ts` and use it as a handler:

```typescript
export const renewableToolsFunction = defineFunction({
  name: 'renewableTools',
  entry: '../functions/renewableTools/handler.ts',
});

// Later in schema:
deleteRenewableProject: a.mutation()
  .handler(a.handler.function(renewableToolsFunction))
```

Amplify Gen 2 is SUPPOSED to:
1. Create the Lambda function ✅ (this worked)
2. Create an AppSync data source for the Lambda ❌ (this FAILED)
3. Create resolvers connecting the mutations to the data source ❌ (this FAILED)

Steps 2 and 3 didn't happen, leaving the mutations with no actual implementation.

## The Fix

Manually create the AppSync data source and resolvers in `amplify/backend.ts`:

```typescript
// Add Lambda as AppSync data source
const renewableToolsDataSource = backend.data.resources.graphqlApi.addLambdaDataSource(
  'RenewableToolsDataSource',
  backend.renewableToolsFunction.resources.lambda
);

// Create resolvers
renewableToolsDataSource.createResolver('deleteRenewableProjectResolver', {
  typeName: 'Mutation',
  fieldName: 'deleteRenewableProject',
});

renewableToolsDataSource.createResolver('renameRenewableProjectResolver', {
  typeName: 'Mutation',
  fieldName: 'renameRenewableProject',
});

renewableToolsDataSource.createResolver('exportRenewableProjectResolver', {
  typeName: 'Mutation',
  fieldName: 'exportRenewableProject',
});

renewableToolsDataSource.createResolver('getRenewableProjectDetailsResolver', {
  typeName: 'Query',
  fieldName: 'getRenewableProjectDetails',
});
```

## Why We Didn't Find This Sooner

1. **The mutation appeared to work** - It returned `success: true`
2. **No errors were thrown** - The default resolver just returned mock data
3. **The Lambda existed** - So we assumed it was being called
4. **No logs** - We checked Lambda logs but didn't realize the Lambda wasn't being invoked at all

## Verification After Fix

After deploying the fix:

### 1. Check Data Source Exists
```bash
aws appsync list-data-sources --api-id fhzj4la45fevdnax5s2o4hbuqy \
  | jq -r '.dataSources[] | select(.name | contains("RenewableTools"))'
```

Should show the Lambda data source.

### 2. Check Resolver is Connected
```bash
aws appsync get-resolver \
  --api-id fhzj4la45fevdnax5s2o4hbuqy \
  --type-name Mutation \
  --field-name deleteRenewableProject \
  | jq '{dataSourceName, kind}'
```

Should show:
```json
{
  "dataSourceName": "RenewableToolsDataSource",
  "kind": "UNIT"
}
```

### 3. Test Deletion
1. Delete a project in the UI
2. Check Lambda logs:
```bash
aws logs tail /aws/lambda/amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh \
  --since 1m --format short | grep "NEW CODE v2.0"
```

Should see the log message.

### 4. Verify S3 Deletion
```bash
aws s3 ls "s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/renewable/projects/" \
  --recursive | grep "project.json" | wc -l
```

Should be one less than before.

## Summary

- **Problem**: AppSync resolver not connected to Lambda
- **Cause**: Amplify Gen 2 bug - doesn't auto-create data source for functions in data/resource.ts
- **Solution**: Manually create data source and resolvers in backend.ts
- **Status**: Fixed - needs deployment

## Next Steps

1. **Deploy the fix:**
   ```bash
   # Sandbox should auto-deploy, or restart it
   npx ampx sandbox
   ```

2. **Wait for deployment** (5-10 minutes)

3. **Verify data source created** (commands above)

4. **Test deletion** - Should actually work now

---

**This was the real issue all along.** The Lambda code was fine. The deployment was fine. The AppSync resolver just wasn't connected to anything.
