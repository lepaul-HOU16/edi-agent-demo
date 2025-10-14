# Async Renewable Energy Job Pattern

## Problem Statement

Renewable energy queries (terrain analysis, layout optimization) take 30-60+ seconds to complete, but AWS AppSync has a hard 30-second timeout limit for GraphQL mutations. This causes all renewable queries to timeout before completion.

**Root Cause:** Synchronous request/response pattern hits AppSync's 30s limit even though Lambda functions have 60-90s timeouts.

## Requirements

### 1. Async Job Model

**User Story:** As a user, I want long-running renewable energy analyses to complete successfully without timeout errors.

**Acceptance Criteria:**
- WHEN I submit a renewable energy query
- THEN the system returns immediately with a job ID and "processing" status
- AND the analysis continues in the background
- AND I can see real-time progress updates
- AND results appear automatically when complete

### 2. Job Status Tracking

**User Story:** As a user, I want to see the progress of my renewable energy analysis in real-time.

**Acceptance Criteria:**
- WHEN a job is processing
- THEN I see a progress indicator with status updates
- AND I see estimated time remaining
- AND I see which step is currently executing (terrain, layout, simulation)
- AND the UI updates automatically without page refresh

### 3. Result Delivery

**User Story:** As a user, I want to see my analysis results as soon as they're ready.

**Acceptance Criteria:**
- WHEN a job completes successfully
- THEN results appear automatically in the chat
- AND artifacts (maps, charts) render correctly
- AND I can interact with the results immediately
- AND results persist if I refresh the page

### 4. Error Handling

**User Story:** As a user, I want clear feedback if my analysis fails.

**Acceptance Criteria:**
- WHEN a job fails
- THEN I see a clear error message
- AND I see what went wrong
- AND I see suggested remediation steps
- AND I can retry the analysis

### 5. Job History

**User Story:** As a developer, I want to track job execution for debugging.

**Acceptance Criteria:**
- WHEN jobs execute
- THEN execution details are logged
- AND job status is persisted in DynamoDB
- AND I can query job history
- AND I can see performance metrics

## Technical Requirements

### Database Schema

```typescript
RenewableJob {
  id: string (PK)
  chatSessionId: string (GSI)
  userId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  query: string
  jobType: 'terrain' | 'layout' | 'simulation' | 'full_analysis'
  progress: {
    currentStep: string
    totalSteps: number
    completedSteps: number
    estimatedTimeRemaining: number
  }
  result: {
    message: string
    artifacts: any[]
    thoughtSteps: any[]
  }
  error: {
    message: string
    type: string
    remediation: string
  }
  createdAt: timestamp
  updatedAt: timestamp
  completedAt: timestamp
}
```

### API Operations

1. **startRenewableJob** (mutation)
   - Input: query, chatSessionId, userId
   - Output: jobId, status='pending'
   - Action: Create job record, invoke orchestrator async

2. **getRenewableJobStatus** (query)
   - Input: jobId
   - Output: job status and progress
   - Action: Query DynamoDB for job record

3. **onRenewableJobUpdate** (subscription)
   - Input: jobId or chatSessionId
   - Output: real-time job updates
   - Action: Subscribe to job status changes

### Lambda Flow

1. **lightweightAgent** receives renewable query
2. Creates job record in DynamoDB (status='pending')
3. Invokes orchestrator with `InvocationType='Event'` (async)
4. Returns job ID immediately (< 1 second)
5. **orchestrator** processes in background
6. Updates job status to 'processing'
7. Executes terrain/layout/simulation tools
8. Updates progress after each step
9. Writes final results to DynamoDB
10. Publishes completion event via AppSync subscription

### Frontend Flow

1. User submits query
2. Receives job ID immediately
3. Shows "Analyzing..." with progress bar
4. Subscribes to job updates
5. Updates progress in real-time
6. Displays results when complete
7. Handles errors gracefully

## Success Metrics

- ✅ Zero timeout errors for renewable queries
- ✅ < 1 second initial response time
- ✅ Real-time progress updates every 5-10 seconds
- ✅ Results display automatically when ready
- ✅ 100% job completion rate (no lost jobs)
- ✅ Clear error messages with remediation

## Non-Functional Requirements

- **Performance**: Initial response < 1s, total analysis < 90s
- **Reliability**: Jobs must complete even if user closes browser
- **Scalability**: Support 10+ concurrent jobs
- **Monitoring**: CloudWatch metrics for job duration, success rate
- **Recovery**: Failed jobs can be retried
