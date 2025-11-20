# S3 Storage Architecture for Artifacts

## Overview

The platform uses Amazon S3 for storing large artifacts (visualizations, reports, data files) with metadata stored in DynamoDB. This hybrid approach optimizes for both cost and performance.

## Storage Strategy

### Size-Based Storage Decision

```typescript
const ARTIFACT_SIZE_THRESHOLD = 100 * 1024; // 100 KB

if (artifactSize > ARTIFACT_SIZE_THRESHOLD) {
  // Store in S3, reference in DynamoDB
  const s3Key = await uploadToS3(artifact);
  return { s3Key, size: artifactSize };
} else {
  // Store directly in DynamoDB
  return { data: artifact, size: artifactSize };
}
```

### Benefits

- **Cost Optimization**: S3 is cheaper for large objects
- **Performance**: DynamoDB is faster for small objects
- **Scalability**: S3 handles unlimited storage
- **Durability**: Both services provide 99.999999999% durability

## Bucket Structure

```
s3://storage-bucket/
├── well-data/                          # LAS files and well data
│   ├── WELL-001.las
│   ├── WELL-002.las
│   └── metadata/
│       └── WELL-001-metadata.json
│
├── renewable-projects/                 # Renewable energy artifacts
│   ├── {project-name}/
│   │   ├── metadata.json              # Project metadata
│   │   ├── terrain-analysis.json      # Terrain data
│   │   ├── terrain-map.html           # Interactive map
│   │   ├── terrain-map.png            # Static map image
│   │   ├── layout-optimization.json   # Layout data
│   │   ├── layout-map.html            # Layout visualization
│   │   ├── wake-simulation.json       # Wake analysis data
│   │   ├── wake-map.png               # Wake visualization
│   │   ├── wind-rose.png              # Wind rose chart
│   │   ├── wind-rose-interactive.html # Interactive wind rose
│   │   └── report.pdf                 # Executive report
│   └── ...
│
├── artifacts/                          # General artifacts
│   ├── {artifact-id}.json
│   ├── {artifact-id}.png
│   ├── {artifact-id}.html
│   └── ...
│
└── temp/                               # Temporary files (auto-delete after 24h)
    └── {session-id}/
        └── ...
```

## Naming Conventions

### Project-Based Artifacts

```
renewable-projects/{project-name}/{artifact-type}.{extension}

Examples:
- renewable-projects/west-texas-wind-farm-2025/terrain-map.html
- renewable-projects/west-texas-wind-farm-2025/layout-optimization.json
- renewable-projects/west-texas-wind-farm-2025/report.pdf
```

### Generic Artifacts

```
artifacts/{artifact-id}.{extension}

Examples:
- artifacts/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png
- artifacts/terrain-analysis-20250115-103045.json
```

### Well Data

```
well-data/{well-name}.{extension}

Examples:
- well-data/WELL-001.las
- well-data/WELL-002.las
- well-data/metadata/WELL-001-metadata.json
```

## Metadata Structure

### Project Metadata (metadata.json)

```json
{
  "projectId": "west-texas-wind-farm-2025",
  "projectName": "West Texas Wind Farm",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T14:30:00Z",
  "status": "analysis_complete",
  "location": {
    "lat": 35.067482,
    "lng": -101.395466,
    "address": "West Texas, USA"
  },
  "artifacts": [
    {
      "type": "terrain_analysis",
      "s3Key": "renewable-projects/west-texas-wind-farm-2025/terrain-map.html",
      "size": 245678,
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "type": "layout_optimization",
      "s3Key": "renewable-projects/west-texas-wind-farm-2025/layout-map.html",
      "size": 189234,
      "createdAt": "2025-01-15T11:45:00Z"
    }
  ],
  "completedSteps": ["terrain", "layout", "wake", "report"],
  "owner": "user-123",
  "tags": ["wind-farm", "texas", "feasibility-study"]
}
```

## Access Patterns

### 1. Upload Artifact

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadArtifact(
  projectId: string,
  artifactType: string,
  content: Buffer | string,
  contentType: string
): Promise<string> {
  const s3Client = new S3Client({});
  const key = `renewable-projects/${projectId}/${artifactType}.${getExtension(contentType)}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
    Body: content,
    ContentType: contentType,
    Metadata: {
      projectId,
      artifactType,
      uploadedAt: new Date().toISOString(),
    },
  }));
  
  return key;
}
```

### 2. Generate Presigned URL

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

async function getArtifactUrl(s3Key: string): Promise<string> {
  const s3Client = new S3Client({});
  const command = new GetObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: s3Key,
  });
  
  // URL expires in 1 hour
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```

### 3. Download Artifact

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

async function downloadArtifact(s3Key: string): Promise<Buffer> {
  const s3Client = new S3Client({});
  const response = await s3Client.send(new GetObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: s3Key,
  }));
  
  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
```

### 4. List Project Artifacts

```typescript
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

async function listProjectArtifacts(projectId: string): Promise<string[]> {
  const s3Client = new S3Client({});
  const response = await s3Client.send(new ListObjectsV2Command({
    Bucket: process.env.STORAGE_BUCKET,
    Prefix: `renewable-projects/${projectId}/`,
  }));
  
  return response.Contents?.map(obj => obj.Key!) || [];
}
```

### 5. Delete Artifact

```typescript
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

async function deleteArtifact(s3Key: string): Promise<void> {
  const s3Client = new S3Client({});
  await s3Client.send(new DeleteObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: s3Key,
  }));
}
```

## Lifecycle Policies

### Automatic Cleanup

```json
{
  "Rules": [
    {
      "Id": "DeleteTempFilesAfter24Hours",
      "Status": "Enabled",
      "Prefix": "temp/",
      "Expiration": {
        "Days": 1
      }
    },
    {
      "Id": "TransitionOldArtifactsToGlacier",
      "Status": "Enabled",
      "Prefix": "renewable-projects/",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    },
    {
      "Id": "DeleteOldArtifactsAfter1Year",
      "Status": "Enabled",
      "Prefix": "artifacts/",
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

### Benefits

- **Cost Savings**: Move old artifacts to cheaper storage
- **Automatic Cleanup**: Remove temporary files automatically
- **Compliance**: Enforce data retention policies

## Security

### Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowLambdaAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/LambdaExecutionRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::storage-bucket/*"
    },
    {
      "Sid": "DenyUnencryptedUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::storage-bucket/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

### Encryption

- **At Rest**: SSE-S3 (AES-256) encryption enabled by default
- **In Transit**: All access via HTTPS only
- **Presigned URLs**: Time-limited access (1 hour expiration)

## Performance Optimization

### CloudFront CDN

```typescript
// Use CloudFront for frequently accessed artifacts
const cloudfrontUrl = `https://d1234567890.cloudfront.net/${s3Key}`;

// Benefits:
// - Faster global access
// - Reduced S3 costs
// - Better user experience
```

### Multipart Upload

```typescript
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

async function uploadLargeArtifact(key: string, file: Buffer): Promise<void> {
  const s3Client = new S3Client({});
  const partSize = 5 * 1024 * 1024; // 5 MB parts
  
  // Initiate multipart upload
  const { UploadId } = await s3Client.send(new CreateMultipartUploadCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
  }));
  
  // Upload parts
  const parts = [];
  for (let i = 0; i < Math.ceil(file.length / partSize); i++) {
    const start = i * partSize;
    const end = Math.min(start + partSize, file.length);
    const part = file.slice(start, end);
    
    const { ETag } = await s3Client.send(new UploadPartCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: key,
      UploadId,
      PartNumber: i + 1,
      Body: part,
    }));
    
    parts.push({ ETag, PartNumber: i + 1 });
  }
  
  // Complete upload
  await s3Client.send(new CompleteMultipartUploadCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
    UploadId,
    MultipartUpload: { Parts: parts },
  }));
}
```

## Monitoring

### CloudWatch Metrics

- **Storage Size**: Total bucket size
- **Request Count**: GET/PUT/DELETE requests
- **Error Rate**: 4xx/5xx errors
- **Data Transfer**: Bytes uploaded/downloaded

### Alarms

```typescript
// CloudWatch alarm for high error rate
{
  AlarmName: 'S3-High-Error-Rate',
  MetricName: '4xxErrors',
  Namespace: 'AWS/S3',
  Statistic: 'Sum',
  Period: 300,
  EvaluationPeriods: 1,
  Threshold: 100,
  ComparisonOperator: 'GreaterThanThreshold'
}
```

## Best Practices

1. **Use Consistent Naming**: Follow naming conventions for easy organization
2. **Enable Versioning**: Protect against accidental deletions
3. **Implement Lifecycle Policies**: Automate cost optimization
4. **Use Presigned URLs**: Secure temporary access
5. **Monitor Costs**: Track storage and transfer costs
6. **Encrypt Data**: Enable encryption at rest and in transit
7. **Tag Resources**: Use tags for cost allocation and organization
8. **Test Disaster Recovery**: Regularly test backup and restore procedures

## Cost Optimization

### Storage Classes

- **Standard**: Frequently accessed artifacts (< 30 days old)
- **Intelligent-Tiering**: Automatically optimize based on access patterns
- **Glacier**: Long-term archival (> 90 days old)

### Estimated Costs

```
Storage (Standard): $0.023 per GB/month
Storage (Glacier): $0.004 per GB/month
PUT Requests: $0.005 per 1,000 requests
GET Requests: $0.0004 per 1,000 requests
Data Transfer Out: $0.09 per GB (first 10 TB)

Example Monthly Cost (1000 projects):
- 100 GB storage: $2.30
- 10,000 PUT requests: $0.05
- 100,000 GET requests: $0.04
- 50 GB transfer: $4.50
Total: ~$7/month
```

## Conclusion

This S3 storage architecture provides a scalable, cost-effective, and secure solution for artifact storage. The hybrid approach with DynamoDB optimizes for both performance and cost, while lifecycle policies ensure automatic cleanup and cost optimization.
