# Project Persistence Infrastructure Setup

## Overview

This document describes the infrastructure setup for renewable energy project persistence, including DynamoDB session context, AWS Location Service for reverse geocoding, and S3 bucket structure.

## Components Deployed

### 1. DynamoDB Session Context Table

**Table Name:** `RenewableSessionContext`

**Purpose:** Store session-based active project tracking and project history

**Schema:**
- **Partition Key:** `session_id` (String)
- **Attributes:**
  - `user_id` (String)
  - `active_project` (String) - Current project name
  - `project_history` (List) - Recently accessed projects
  - `last_updated` (String) - ISO timestamp
  - `ttl` (Number) - Time-to-live for auto-cleanup (7 days)

**Configuration:**
- Billing Mode: PAY_PER_REQUEST (on-demand)
- TTL Enabled: Yes (7 days)
- Removal Policy: DESTROY (for development)

### 2. AWS Location Service Place Index

**Index Name:** `RenewableProjectPlaceIndex`

**Purpose:** Reverse geocoding coordinates to location names for human-friendly project names

**Configuration:**
- Data Source: Esri
- Pricing Plan: RequestBasedUsage
- Description: Place index for renewable energy project location names

**Capabilities:**
- `SearchPlaceIndexForPosition`: Convert coordinates to location names
- `SearchPlaceIndexForText`: Search for locations by name

### 3. S3 Bucket Structure

**Bucket:** Amplify storage bucket (existing)

**New Prefixes:**
- `renewable/projects/` - Root for all project data
- `renewable/projects/{project-name}/` - Individual project directories
- `renewable/projects/{project-name}/project.json` - Project metadata
- `renewable/projects/{project-name}/terrain/` - Terrain analysis results
- `renewable/projects/{project-name}/layout/` - Layout optimization results
- `renewable/projects/{project-name}/simulation/` - Wake simulation results
- `renewable/projects/{project-name}/reports/` - Generated reports

**Access Control:**
- Authenticated users: read, write, delete
- Guest users: read only

### 4. IAM Permissions

**Orchestrator Lambda Permissions:**

**DynamoDB:**
- `dynamodb:GetItem` - Read session context
- `dynamodb:PutItem` - Create session context
- `dynamodb:UpdateItem` - Update session context
- `dynamodb:Query` - Query session data
- `dynamodb:Scan` - List sessions

**AWS Location Service:**
- `geo:SearchPlaceIndexForPosition` - Reverse geocoding
- `geo:SearchPlaceIndexForText` - Location search

**S3:**
- `s3:GetObject` - Read project data
- `s3:PutObject` - Write project data
- `s3:ListBucket` - List projects
- `s3:DeleteObject` - Delete project data

### 5. Environment Variables

**Orchestrator Lambda:**
- `SESSION_CONTEXT_TABLE` - DynamoDB table name
- `AWS_LOCATION_PLACE_INDEX` - Place index name
- `RENEWABLE_S3_BUCKET` - S3 bucket name
- `AWS_REGION` - AWS region (auto-set by Lambda)

## Deployment

### Prerequisites

1. AWS credentials configured
2. Amplify CLI installed (`npm install -g @aws-amplify/cli`)
3. Node.js 18+ installed

### Deployment Steps

#### Option 1: Automated Deployment

```bash
# Run deployment script
./scripts/deploy-project-persistence-infrastructure.sh
```

This script will:
1. Stop any running sandbox
2. Deploy infrastructure with `npx ampx sandbox`
3. Wait for deployment to complete
4. Run verification tests
5. Keep sandbox running

#### Option 2: Manual Deployment

```bash
# Stop current sandbox (if running)
# Press Ctrl+C in sandbox terminal

# Start sandbox to deploy infrastructure
npx ampx sandbox

# Wait for "Deployed" message (5-10 minutes)

# In another terminal, verify deployment
node tests/test-project-persistence-infrastructure.js
```

### Verification

Run the test script to verify all components are deployed:

```bash
node tests/test-project-persistence-infrastructure.js
```

Expected output:
```
✅ Session context table exists
✅ Place index exists
✅ S3 bucket accessible
✅ Orchestrator Lambda exists
✅ IAM role exists
```

## Usage

### Session Context Table

**Create/Update Session Context:**
```typescript
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });

await client.send(new PutItemCommand({
  TableName: 'RenewableSessionContext',
  Item: {
    session_id: { S: 'session-123' },
    user_id: { S: 'user-456' },
    active_project: { S: 'west-texas-wind-farm' },
    project_history: { L: [
      { S: 'west-texas-wind-farm' },
      { S: 'panhandle-wind' }
    ]},
    last_updated: { S: new Date().toISOString() },
    ttl: { N: String(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60) }
  }
}));
```

**Read Session Context:**
```typescript
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });

const response = await client.send(new GetItemCommand({
  TableName: 'RenewableSessionContext',
  Key: {
    session_id: { S: 'session-123' }
  }
}));

const sessionContext = {
  session_id: response.Item.session_id.S,
  user_id: response.Item.user_id.S,
  active_project: response.Item.active_project?.S,
  project_history: response.Item.project_history?.L.map(item => item.S),
  last_updated: response.Item.last_updated.S
};
```

### AWS Location Service

**Reverse Geocoding:**
```typescript
import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';

const client = new LocationClient({ region: 'us-east-1' });

const response = await client.send(new SearchPlaceIndexForPositionCommand({
  IndexName: 'RenewableProjectPlaceIndex',
  Position: [-101.395466, 35.067482], // [longitude, latitude]
  MaxResults: 1
}));

const location = response.Results[0];
const locationName = location.Place.Label; // e.g., "Amarillo, TX, USA"
```

**Location Search:**
```typescript
import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';

const client = new LocationClient({ region: 'us-east-1' });

const response = await client.send(new SearchPlaceIndexForTextCommand({
  IndexName: 'RenewableProjectPlaceIndex',
  Text: 'West Texas',
  MaxResults: 5
}));

const locations = response.Results.map(result => ({
  label: result.Place.Label,
  coordinates: result.Place.Geometry.Point // [longitude, latitude]
}));
```

### S3 Project Data

**Save Project Data:**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({ region: 'us-east-1' });

const projectData = {
  project_id: 'uuid-v4',
  project_name: 'west-texas-wind-farm',
  created_at: new Date().toISOString(),
  coordinates: {
    latitude: 35.067482,
    longitude: -101.395466
  }
};

await client.send(new PutObjectCommand({
  Bucket: process.env.RENEWABLE_S3_BUCKET,
  Key: 'renewable/projects/west-texas-wind-farm/project.json',
  Body: JSON.stringify(projectData, null, 2),
  ContentType: 'application/json'
}));
```

**Load Project Data:**
```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({ region: 'us-east-1' });

const response = await client.send(new GetObjectCommand({
  Bucket: process.env.RENEWABLE_S3_BUCKET,
  Key: 'renewable/projects/west-texas-wind-farm/project.json'
}));

const bodyString = await response.Body.transformToString();
const projectData = JSON.parse(bodyString);
```

## Troubleshooting

### DynamoDB Table Not Found

**Symptom:** `ResourceNotFoundException` when accessing session context table

**Solution:**
1. Verify table exists: `aws dynamodb describe-table --table-name RenewableSessionContext`
2. If not found, redeploy: `npx ampx sandbox`
3. Check region matches: `echo $AWS_REGION`

### Location Service Not Available

**Symptom:** `ResourceNotFoundException` when using place index

**Solution:**
1. Verify place index exists: `aws location describe-place-index --index-name RenewableProjectPlaceIndex`
2. If not found, redeploy: `npx ampx sandbox`
3. Check IAM permissions for `geo:SearchPlaceIndexForPosition`

### S3 Access Denied

**Symptom:** `AccessDenied` when reading/writing project data

**Solution:**
1. Verify bucket exists: `aws s3 ls s3://$RENEWABLE_S3_BUCKET`
2. Check IAM permissions for orchestrator Lambda
3. Verify bucket policy allows Lambda access

### Environment Variables Not Set

**Symptom:** Orchestrator can't find table/index names

**Solution:**
1. Check Lambda configuration: `aws lambda get-function-configuration --function-name <orchestrator-name>`
2. Verify environment variables are set:
   - `SESSION_CONTEXT_TABLE`
   - `AWS_LOCATION_PLACE_INDEX`
   - `RENEWABLE_S3_BUCKET`
3. Redeploy if missing: `npx ampx sandbox`

## Cost Considerations

### DynamoDB
- **Billing Mode:** Pay-per-request
- **Estimated Cost:** $0.25 per million read/write requests
- **Expected Usage:** < 1000 requests/day = ~$0.01/day

### AWS Location Service
- **Pricing:** $0.50 per 1000 requests
- **Expected Usage:** < 100 requests/day = ~$0.01/day

### S3
- **Storage:** $0.023 per GB/month
- **Expected Usage:** < 1 GB = ~$0.02/month
- **Requests:** Minimal cost for GET/PUT operations

**Total Estimated Cost:** < $1/month for development usage

## Security Considerations

1. **Session Context TTL:** Automatically deletes old sessions after 7 days
2. **S3 Access Control:** Authenticated users only for write operations
3. **IAM Least Privilege:** Orchestrator has minimal required permissions
4. **Location Service:** No PII stored, only coordinates and location names

## Next Steps

After infrastructure is deployed:

1. **Task 2:** Implement ProjectStore for S3-based persistence
2. **Task 3:** Implement ProjectNameGenerator with Location Service integration
3. **Task 4:** Implement SessionContextManager for DynamoDB operations
4. **Task 5:** Implement ProjectResolver for natural language references

## References

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS Location Service Documentation](https://docs.aws.amazon.com/location/)
- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Project Persistence Design Document](.kiro/specs/renewable-project-persistence/design.md)
