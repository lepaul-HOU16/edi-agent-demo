# Async Renewable Energy Job Pattern - Design

## Architecture Overview

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │ 1. startRenewableJob mutation
       ▼
┌─────────────────────┐
│   AppSync GraphQL   │
│  (< 1s response)    │
└──────┬──────────────┘
       │ 2. Invoke Lambda
       ▼
┌──────────────────────┐
│  lightweightAgent    │
│  - Create job record │
│  - Invoke async      │
│  - Return job ID     │
└──────┬───────────────┘
       │ 3. Async invoke (Event)
       ▼
┌───────────────────────┐
│ renewableOrchestrator │
│  - Update progress    │
│  - Execute tools      │
│  - Write results      │
└──────┬────────────────┘
       │ 4. Publish updates
       ▼
┌──────────────────────┐
│   AppSync Pub/Sub    │
│   (Subscriptions)    │
└──────┬───────────────┘
       │ 5. Real-time updates
       ▼
┌─────────────┐
│   Frontend  │
│  (displays  │
│   results)  │
└─────────────┘
```

## Database Schema

### RenewableJob Model

```typescript
// amplify/data/resource.ts
RenewableJob: a.model({
  chatSessionId: a.id().required(),
  userId: a.string().required(),
  status: a.enum(['pending', 'processing', 'completed', 'failed']).required(),
  query: a.string().required(),
  jobType: a.enum(['terrain', 'layout', 'simulation', 'full_analysis']).required(),
  
  // Progress tracking
  currentStep: a.string(),
  totalSteps: a.integer(),
  completedSteps: a.integer(),
  estimatedTimeRemaining: a.integer(),
  
  // Results
  resultMessage: a.string(),
  artifacts: a.json().array(),
  thoughtSteps: a.json().array(),
  
  // Error handling
  errorMessage: a.string(),
  errorType: a.string(),
  errorRemediation: a.string(),
  
  // Timestamps
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  completedAt: a.datetime(),
})
.secondaryIndexes((index) => [
  index("chatSessionId").sortKeys(["createdAt"]),
  index("userId").sortKeys(["createdAt"])
])
.authorization((allow) => [allow.owner(), allow.authenticated()])
```

## GraphQL API

### Mutations

```graphql
# Start a new renewable energy job
startRenewableJob(
  chatSessionId: ID!
  query: String!
  jobType: RenewableJobType!
): RenewableJobResponse!

type RenewableJobResponse {
  jobId: ID!
  status: JobStatus!
  message: String!
}
```

### Queries

```graphql
# Get job status
getRenewableJob(jobId: ID!): RenewableJob

# List jobs for a chat session
listRenewableJobs(chatSessionId: ID!): [RenewableJob!]!
```

### Subscriptions

```graphql
# Subscribe to job updates
onRenewableJobUpdate(jobId: ID!): RenewableJob
  @aws_subscribe(mutations: ["updateRenewableJob"])

# Subscribe to all jobs in a chat session
onChatSessionJobUpdate(chatSessionId: ID!): RenewableJob
  @aws_subscribe(mutations: ["updateRenewableJob"])
```

## Component Design

### 1. Job Creation (lightweightAgent)

```typescript
// amplify/functions/agents/handler.ts

async function handleRenewableQuery(query: string, chatSessionId: string, userId: string) {
  // 1. Create job record
  const job = await createRenewableJob({
    chatSessionId,
    userId,
    query,
    jobType: detectJobType(query),
    status: 'pending',
    totalSteps: 3, // terrain, layout, simulation
    completedSteps: 0
  });
  
  // 2. Invoke orchestrator asynchronously
  await invokeOrchestratorAsync({
    jobId: job.id,
    query,
    chatSessionId,
    userId
  });
  
  // 3. Return immediately
  return {
    success: true,
    message: `Analysis started. Job ID: ${job.id}`,
    jobId: job.id,
    artifacts: [{
      type: 'job_status',
      data: {
        jobId: job.id,
        status: 'pending',
        message: 'Your renewable energy analysis is starting...'
      }
    }]
  };
}

async function invokeOrchestratorAsync(payload: any) {
  const command = new InvokeCommand({
    FunctionName: process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME,
    InvocationType: 'Event', // CRITICAL: Async invocation
    Payload: JSON.stringify(payload)
  });
  
  await lambdaClient.send(command);
}
```

### 2. Job Processing (renewableOrchestrator)

```typescript
// amplify/functions/renewableOrchestrator/handler.ts

export async function handler(event: any) {
  const { jobId, query, chatSessionId, userId } = event;
  
  try {
    // Update status to processing
    await updateJob(jobId, {
      status: 'processing',
      currentStep: 'terrain_analysis'
    });
    
    // Step 1: Terrain analysis
    const terrainResult = await invokeTerrainTool(query);
    await updateJob(jobId, {
      completedSteps: 1,
      currentStep: 'layout_optimization'
    });
    
    // Step 2: Layout optimization
    const layoutResult = await invokeLayoutTool(terrainResult);
    await updateJob(jobId, {
      completedSteps: 2,
      currentStep: 'simulation'
    });
    
    // Step 3: Simulation
    const simulationResult = await invokeSimulationTool(layoutResult);
    await updateJob(jobId, {
      completedSteps: 3,
      currentStep: 'complete'
    });
    
    // Combine results
    const artifacts = [
      ...terrainResult.artifacts,
      ...layoutResult.artifacts,
      ...simulationResult.artifacts
    ];
    
    // Update job with final results
    await updateJob(jobId, {
      status: 'completed',
      resultMessage: 'Analysis complete!',
      artifacts: JSON.stringify(artifacts),
      completedAt: new Date().toISOString()
    });
    
    // Publish completion event
    await publishJobUpdate(jobId, chatSessionId);
    
  } catch (error) {
    // Handle errors
    await updateJob(jobId, {
      status: 'failed',
      errorMessage: error.message,
      errorType: error.name,
      errorRemediation: getRemediation(error)
    });
    
    await publishJobUpdate(jobId, chatSessionId);
  }
}

async function updateJob(jobId: string, updates: Partial<RenewableJob>) {
  // Update DynamoDB record
  await docClient.send(new UpdateCommand({
    TableName: process.env.RENEWABLE_JOB_TABLE,
    Key: { id: jobId },
    UpdateExpression: buildUpdateExpression(updates),
    ExpressionAttributeValues: updates
  }));
}

async function publishJobUpdate(jobId: string, chatSessionId: string) {
  // Trigger AppSync subscription
  await appsyncClient.mutate({
    mutation: UPDATE_RENEWABLE_JOB,
    variables: { jobId, chatSessionId }
  });
}
```

### 3. Frontend Integration

```typescript
// src/hooks/useRenewableJob.ts

export function useRenewableJob(jobId: string) {
  const [job, setJob] = useState<RenewableJob | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Subscribe to job updates
    const subscription = client.graphql({
      query: onRenewableJobUpdate,
      variables: { jobId }
    }).subscribe({
      next: ({ data }) => {
        setJob(data.onRenewableJobUpdate);
        setLoading(false);
      },
      error: (error) => console.error('Subscription error:', error)
    });
    
    // Fetch initial status
    fetchJobStatus(jobId).then(setJob);
    
    return () => subscription.unsubscribe();
  }, [jobId]);
  
  return { job, loading };
}
```

```typescript
// src/components/RenewableJobStatus.tsx

export function RenewableJobStatus({ jobId }: { jobId: string }) {
  const { job, loading } = useRenewableJob(jobId);
  
  if (loading) return <Spinner />;
  if (!job) return <Alert>Job not found</Alert>;
  
  return (
    <Box>
      <ProgressBar 
        value={job.completedSteps} 
        max={job.totalSteps}
        label={job.currentStep}
      />
      
      {job.status === 'processing' && (
        <StatusIndicator type="in-progress">
          {job.currentStep}... ({job.completedSteps}/{job.totalSteps})
        </StatusIndicator>
      )}
      
      {job.status === 'completed' && (
        <>
          <StatusIndicator type="success">Analysis complete!</StatusIndicator>
          <RenewableArtifacts artifacts={job.artifacts} />
        </>
      )}
      
      {job.status === 'failed' && (
        <Alert type="error">
          {job.errorMessage}
          <br />
          <strong>Remediation:</strong> {job.errorRemediation}
        </Alert>
      )}
    </Box>
  );
}
```

## Data Flow

### Happy Path

1. **User submits query** → "Analyze terrain at 40.7128, -74.0060"
2. **lightweightAgent** creates job → Returns job ID in < 1s
3. **Frontend** shows progress indicator → "Analyzing terrain..."
4. **Orchestrator** processes async → Updates progress every 10-15s
5. **Frontend** receives updates → Progress bar advances
6. **Orchestrator** completes → Writes results to DynamoDB
7. **Frontend** receives completion → Displays artifacts automatically

### Error Path

1. **Orchestrator** encounters error → Catches exception
2. **Updates job** status='failed' → Writes error details
3. **Frontend** receives update → Shows error message
4. **User** sees remediation → Can retry if needed

## Performance Considerations

### Optimization Strategies

1. **Parallel Tool Execution**: Run independent tools concurrently
2. **Result Caching**: Cache terrain data for repeated queries
3. **Progressive Results**: Return partial results as they complete
4. **Connection Pooling**: Reuse Lambda connections
5. **Batch Updates**: Group progress updates to reduce DynamoDB writes

### Monitoring

```typescript
// CloudWatch Metrics
- JobStartLatency: Time to create job and return
- JobProcessingDuration: Total time from start to completion
- JobSuccessRate: Percentage of successful completions
- StepDuration: Time for each processing step
- SubscriptionLatency: Time from update to frontend receipt
```

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid coordinates, missing parameters
2. **Resource Errors**: Lambda timeout, memory exceeded
3. **External API Errors**: NREL API failure, OSM unavailable
4. **System Errors**: DynamoDB failure, AppSync issues

### Recovery Strategies

1. **Automatic Retry**: Retry transient failures (3 attempts)
2. **Graceful Degradation**: Return partial results if possible
3. **User Notification**: Clear error messages with next steps
4. **Manual Retry**: Allow user to retry failed jobs

## Security

### Authorization

- Jobs are owner-scoped (user can only see their jobs)
- Chat session validation (user must own chat session)
- Rate limiting (max 5 concurrent jobs per user)

### Data Protection

- Sensitive data encrypted at rest (DynamoDB encryption)
- Results expire after 7 days (automatic cleanup)
- PII scrubbing in logs

## Migration Strategy

### Phase 1: Add Job Model (No Breaking Changes)

- Add RenewableJob model to schema
- Deploy database changes
- Keep existing synchronous flow working

### Phase 2: Implement Async Flow (Parallel)

- Add async job creation logic
- Add subscription support
- Test with feature flag

### Phase 3: Switch to Async (Cutover)

- Enable async flow for all renewable queries
- Monitor performance and errors
- Keep synchronous as fallback

### Phase 4: Cleanup (Remove Old Code)

- Remove synchronous flow
- Remove feature flags
- Optimize based on metrics

## Testing Strategy

### Unit Tests

- Job creation logic
- Progress update logic
- Error handling
- Subscription publishing

### Integration Tests

- End-to-end job flow
- Subscription delivery
- Error scenarios
- Concurrent jobs

### Performance Tests

- Load test with 10+ concurrent jobs
- Measure latency at each step
- Test subscription scalability
- Verify no memory leaks

## Rollout Plan

1. **Week 1**: Implement job model and database
2. **Week 2**: Implement async orchestrator flow
3. **Week 3**: Implement frontend subscriptions
4. **Week 4**: Testing and bug fixes
5. **Week 5**: Gradual rollout with monitoring
6. **Week 6**: Full deployment and cleanup
