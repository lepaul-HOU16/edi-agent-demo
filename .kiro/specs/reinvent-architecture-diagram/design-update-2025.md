# Design Document - re:Invent Architecture Diagram Updates 2025

## Overview

This design document specifies the updates needed for the AWS re:Invent architecture diagrams to comprehensively show all AWS services, OSDU data integration, and AWS Data Catalog. The updated diagrams will provide a complete picture of the Energy Data Insights platform architecture for technical audiences.

## Architecture

### Current State Analysis

The existing diagrams show:
- Frontend layer (React, CloudFront, S3)
- API layer (API Gateway, Lambda Authorizer, Cognito)
- Agent layer (Chat Lambda, AgentRouter, specialized agents)
- Orchestration layer (Renewable Orchestrator)
- Tool layer (Python Lambda functions)
- Data layer (DynamoDB tables, S3 storage)
- AI layer (AWS Bedrock)

### Missing Components

The diagrams need to add:
1. **AWS Glue Data Catalog** - For metadata management and data discovery
2. **OSDU Integration** - External data source and ingestion pipeline
3. **AWS Secrets Manager** - For API key storage (NREL, OSDU credentials)
4. **AWS CloudTrail** - For audit logging
5. **GitHub/GitHub Actions** - For CI/CD pipeline
6. **AWS CloudFormation** - For infrastructure deployment
7. **Enhanced annotations** - Cost, performance, security details

## Components and Interfaces

### 1. Complete Service Inventory

#### Frontend Services
- **Amazon S3** (Frontend Bucket): Hosts React SPA static files
- **Amazon CloudFront**: CDN for global content delivery with caching
- **AWS Certificate Manager** (implied): SSL/TLS certificates for HTTPS

#### API Services
- **Amazon API Gateway** (HTTP API): REST API endpoints with CORS
- **AWS Lambda** (Authorizer): Custom JWT validation function
- **Amazon Cognito**: User pool for authentication and user management

#### Compute Services
- **AWS Lambda** (Chat): Main agent orchestration (Node.js, 1024MB, 300s timeout)
- **AWS Lambda** (Renewable Orchestrator): Workflow coordination (Node.js, 1024MB, 300s timeout)
- **AWS Lambda** (Renewable Tools): Python tools for analysis (Python 3.12, 1024MB, 300s timeout)
- **AWS Lambda** (Petrophysics Calculator): LAS file processing (Python 3.12, 512MB, 60s timeout)
- **AWS Lambda** (Projects): Project management operations (Node.js, 512MB, 30s timeout)
- **AWS Lambda** (Chat Sessions): Session CRUD operations (Node.js, 512MB, 30s timeout)

#### Data Services
- **Amazon DynamoDB** (ChatMessage): Message storage with GSI for session queries
- **Amazon DynamoDB** (ChatSession): Session metadata with GSI for user queries
- **Amazon DynamoDB** (Project): Renewable project data
- **Amazon DynamoDB** (AgentProgress): Workflow step tracking
- **Amazon DynamoDB** (SessionContext): Session state with TTL
- **Amazon S3** (Storage Bucket): Artifacts, LAS files, project data
- **AWS Glue Data Catalog**: Metadata for well data, projects, artifacts

#### AI/ML Services
- **AWS Bedrock**: Claude 3.5 Sonnet model access for AI responses

#### Monitoring and Security Services
- **Amazon CloudWatch**: Logs and metrics for all Lambda functions and API Gateway
- **AWS IAM**: Roles and policies for least-privilege access
- **AWS Secrets Manager**: Secure storage for NREL API keys and OSDU credentials
- **AWS CloudTrail**: Audit logging for compliance

#### DevOps Services
- **GitHub**: Source code repository
- **GitHub Actions**: CI/CD pipeline automation
- **AWS CDK**: Infrastructure as code (TypeScript)
- **AWS CloudFormation**: Stack deployment and management

### 2. OSDU Data Integration Architecture

#### OSDU Data Flow

```
OSDU Platform (External)
    ↓
[Data Ingestion Lambda]
    ↓
Amazon S3 (well-data/ prefix)
    ↓
AWS Glue Crawler
    ↓
AWS Glue Data Catalog
    ↓
[Petrophysics Calculator Lambda]
    ↓
Analysis Results → DynamoDB + S3
```

#### OSDU Integration Components

**OSDU Data Ingestion Lambda** (New):
- **Purpose**: Fetch well data from OSDU APIs
- **Runtime**: Python 3.12
- **Timeout**: 300s
- **Memory**: 1024MB
- **Triggers**: EventBridge schedule (daily) or manual API call
- **Outputs**: LAS files to S3 `well-data/` prefix

**OSDU Credentials**:
- Stored in AWS Secrets Manager
- Accessed by ingestion Lambda via IAM role
- Rotated automatically every 90 days

**Data Catalog Integration**:
- Glue Crawler runs after ingestion
- Catalogs well metadata (well name, location, depth, curves)
- Creates searchable schema for data discovery

### 3. AWS Data Catalog Design

#### Catalog Structure

**Database**: `energy-data-insights`

**Tables**:
1. **well_data**
   - Columns: well_id, well_name, latitude, longitude, depth_start, depth_end, curves[], las_file_s3_key
   - Partition: year, month
   - Source: S3 `s3://storage-bucket/well-data/`

2. **renewable_projects**
   - Columns: project_id, project_name, location, turbine_count, capacity_mw, created_at
   - Partition: status (active, archived)
   - Source: S3 `s3://storage-bucket/renewable-projects/`

3. **artifacts**
   - Columns: artifact_id, type, project_id, created_at, s3_key, metadata
   - Partition: artifact_type
   - Source: S3 `s3://storage-bucket/artifacts/`

#### Glue Crawlers

**Well Data Crawler**:
- Schedule: Daily at 2 AM UTC
- Target: S3 `well-data/` prefix
- Classifier: Custom JSON/LAS classifier
- Update behavior: Add new partitions

**Project Data Crawler**:
- Schedule: Weekly on Sunday
- Target: S3 `renewable-projects/` prefix
- Classifier: JSON classifier
- Update behavior: Update schema and add partitions

#### Data Discovery Pattern

```typescript
// Lambda function queries Data Catalog
import { GlueClient, GetTableCommand } from '@aws-sdk/client-glue';

const glue = new GlueClient({});

async function discoverWellData(wellName: string) {
  // Query Data Catalog for well metadata
  const table = await glue.send(new GetTableCommand({
    DatabaseName: 'energy-data-insights',
    Name: 'well_data'
  }));
  
  // Use metadata to construct S3 path
  const s3Key = `well-data/${wellName}.las`;
  
  // Fetch actual data from S3
  return fetchFromS3(s3Key);
}
```

## Data Models

### OSDU Data Model

```typescript
interface OSDUWellData {
  id: string;                    // OSDU well identifier
  name: string;                  // Well name
  location: {
    latitude: number;
    longitude: number;
  };
  depth: {
    start: number;               // meters
    end: number;                 // meters
    unit: 'meters' | 'feet';
  };
  curves: string[];              // Available log curves (GR, RHOB, NPHI, etc.)
  lasFileUrl: string;            // OSDU API URL for LAS file
  metadata: {
    operator: string;
    field: string;
    spudDate: string;
    completionDate: string;
  };
}
```

### Data Catalog Metadata Model

```typescript
interface DataCatalogTable {
  DatabaseName: string;
  Name: string;
  StorageDescriptor: {
    Columns: Array<{
      Name: string;
      Type: string;
      Comment?: string;
    }>;
    Location: string;            // S3 path
    InputFormat: string;
    OutputFormat: string;
    SerdeInfo: {
      SerializationLibrary: string;
      Parameters: Record<string, string>;
    };
  };
  PartitionKeys: Array<{
    Name: string;
    Type: string;
  }>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete Service Coverage
*For any* architecture diagram file, all required AWS services (Cognito, API Gateway, Lambda, DynamoDB, S3, CloudFront, Bedrock, CloudWatch, IAM, Glue Data Catalog, Secrets Manager, CloudTrail) should be present in the diagram source.
**Validates: Requirements 1.1-1.12**

### Property 2: OSDU Integration Completeness
*For any* diagram showing data flow, all OSDU integration components (external source, ingestion Lambda, S3 storage, Data Catalog, agent access) should be present and connected.
**Validates: Requirements 2.1-2.7**

### Property 3: Data Catalog Integration Completeness
*For any* diagram showing data services, AWS Glue Data Catalog should be shown with connections to S3 buckets and Lambda functions that query metadata.
**Validates: Requirements 3.1-3.6**

### Property 4: Data Flow Visualization Completeness
*For any* data flow diagram, all required visualization elements (numbered arrows, sync/async distinction, read/write color coding, data transformation steps) should be present.
**Validates: Requirements 4.1-4.7**

### Property 5: Required Diagram Existence
*For the* complete documentation set, all required dedicated diagrams (Cognito auth, API Gateway routing, Lambda orchestration, DynamoDB access, S3 storage, Bedrock invocation, OSDU ingestion, Data Catalog management) should exist as separate files.
**Validates: Requirements 5.1-5.8**

### Property 6: Configuration Annotation Completeness
*For any* diagram showing Lambda functions or data services, all required annotations (Lambda timeout/memory, DynamoDB capacity mode, S3 storage class, cost drivers, log retention) should be present.
**Validates: Requirements 6.1-6.6**

### Property 7: Security Annotation Completeness
*For any* architecture diagram, all required security elements (encryption at rest/transit, IAM roles, JWT validation, PII indicators, CloudTrail logging, data retention) should be documented.
**Validates: Requirements 7.1-7.7**

### Property 8: Agent Architecture Completeness
*For any* diagram showing the agent layer, all required agent components (AgentRouter, all specialized agents, intent detection, tool invocation, thought steps, artifacts, session context) should be present.
**Validates: Requirements 8.1-8.7**

### Property 9: Async Processing Pattern Completeness
*For any* diagram showing async operations, all required async elements (timeout detection, self-invocation, polling mechanism, DynamoDB updates, timing annotations, error handling) should be present.
**Validates: Requirements 9.1-9.6**

### Property 10: CI/CD Pipeline Completeness
*For any* deployment diagram, all required CI/CD components (GitHub, GitHub Actions, AWS CDK, CloudFormation, deployment stages, testing gates, rollback mechanisms) should be present.
**Validates: Requirements 10.1-10.7**

## Error Handling

### Diagram Generation Errors

**Missing Service Icons**:
- Fallback to text labels if AWS icons unavailable
- Log warning for manual review
- Continue generation with placeholder

**Invalid Mermaid Syntax**:
- Validate syntax before writing files
- Provide clear error messages with line numbers
- Suggest corrections

**File Write Failures**:
- Retry with exponential backoff
- Create backup of existing files before overwrite
- Rollback on failure

### Data Catalog Errors

**Crawler Failures**:
- CloudWatch alarm triggers on crawler failure
- Automatic retry up to 3 times
- SNS notification to operations team

**Schema Mismatch**:
- Version schema changes
- Maintain backward compatibility
- Document breaking changes

## Testing Strategy

### Unit Testing

**Diagram Content Validation**:
- Test that each diagram file contains required services
- Test that connections between services are present
- Test that annotations are properly formatted
- Test that Mermaid syntax is valid

**Example Test**:
```typescript
describe('High-Level Architecture Diagram', () => {
  it('should include all required AWS services', () => {
    const diagramContent = fs.readFileSync('01-high-level-architecture.mmd', 'utf-8');
    
    const requiredServices = [
      'Cognito', 'API Gateway', 'Lambda', 'DynamoDB', 
      'S3', 'CloudFront', 'Bedrock', 'CloudWatch',
      'IAM', 'Glue Data Catalog', 'Secrets Manager', 'CloudTrail'
    ];
    
    requiredServices.forEach(service => {
      expect(diagramContent).toContain(service);
    });
  });
});
```

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for validating diagram properties.

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: reinvent-architecture-diagram, Property {number}: {property_text}**`

**Example Property Test**:
```typescript
import fc from 'fast-check';

describe('Property Tests for Architecture Diagrams', () => {
  /**
   * Feature: reinvent-architecture-diagram, Property 1: Complete Service Coverage
   * For any architecture diagram file, all required AWS services should be present
   */
  it('should have complete service coverage in all diagrams', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllDiagramFiles()),
        (diagramFile) => {
          const content = fs.readFileSync(diagramFile, 'utf-8');
          const requiredServices = getRequiredServicesForDiagram(diagramFile);
          
          return requiredServices.every(service => 
            content.includes(service)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Diagram Rendering**:
- Generate PNG/SVG from Mermaid source
- Verify output files are created
- Check image dimensions meet presentation requirements (1920x1080 minimum)

**Documentation Links**:
- Verify all diagram references in markdown docs are valid
- Check that all S3 paths in diagrams match actual bucket structure
- Validate IAM role ARNs match deployed infrastructure

### Manual Validation

**Visual Review Checklist**:
- [ ] All services use official AWS icons
- [ ] OSDU data flow is visually highlighted (distinct color/style)
- [ ] Arrows clearly show direction of data flow
- [ ] Annotations are readable at presentation size
- [ ] Color scheme is accessible (colorblind-friendly)
- [ ] Diagrams render correctly in presentation software

## Deployment Strategy

### Diagram File Structure

```
.kiro/specs/reinvent-architecture-diagram/
├── diagrams/
│   ├── 01-complete-architecture.mmd          # NEW: All services
│   ├── 02-osdu-integration.mmd                # NEW: OSDU data flow
│   ├── 03-data-catalog-architecture.mmd       # NEW: Glue Data Catalog
│   ├── 04-cognito-auth-flow.mmd               # UPDATED
│   ├── 05-api-gateway-routing.mmd             # UPDATED
│   ├── 06-lambda-orchestration.mmd            # UPDATED
│   ├── 07-dynamodb-access-patterns.mmd        # UPDATED
│   ├── 08-s3-storage-architecture.mmd         # UPDATED
│   ├── 09-bedrock-invocation.mmd              # UPDATED
│   ├── 10-async-processing-pattern.mmd        # UPDATED
│   ├── 11-cicd-pipeline.mmd                   # NEW
│   └── 12-security-architecture.mmd           # NEW
├── output/
│   ├── png/                                   # Generated PNG files
│   └── svg/                                   # Generated SVG files
├── presentation/
│   ├── master-deck.html                       # UPDATED: New diagrams
│   └── backup-slides.html                     # UPDATED: New diagrams
└── scripts/
    ├── generate-diagrams.sh                   # UPDATED: New diagrams
    └── validate-diagrams.ts                   # NEW: Validation script
```

### Generation Pipeline

1. **Update Mermaid Source Files**: Add new services, OSDU integration, Data Catalog
2. **Validate Syntax**: Run Mermaid CLI to check syntax
3. **Generate Images**: Convert .mmd to PNG/SVG at 1920x1080
4. **Update Presentation**: Embed new diagrams in HTML slides
5. **Deploy to S3**: Upload to public/demo/ for re:Invent demo page
6. **Update Documentation**: Link new diagrams in README and guides

### Validation Script

```typescript
// scripts/validate-diagrams.ts
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateDiagram(filePath: string): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for required services
  const requiredServices = [
    'Cognito', 'API Gateway', 'Lambda', 'DynamoDB',
    'S3', 'CloudFront', 'Bedrock', 'CloudWatch'
  ];
  
  requiredServices.forEach(service => {
    if (!content.includes(service)) {
      warnings.push(`Missing service: ${service}`);
    }
  });
  
  // Check for OSDU if data flow diagram
  if (filePath.includes('data-flow') || filePath.includes('osdu')) {
    if (!content.includes('OSDU')) {
      errors.push('OSDU integration not shown in data flow diagram');
    }
  }
  
  // Check for Data Catalog
  if (!content.includes('Glue') && !content.includes('Data Catalog')) {
    warnings.push('Data Catalog not shown');
  }
  
  return {
    file: path.basename(filePath),
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Run validation on all diagrams
const diagramDir = path.join(__dirname, '../diagrams');
const results = fs.readdirSync(diagramDir)
  .filter(f => f.endsWith('.mmd'))
  .map(f => validateDiagram(path.join(diagramDir, f)));

// Report results
console.log('Diagram Validation Results:');
results.forEach(r => {
  console.log(`\n${r.file}: ${r.valid ? '✓ VALID' : '✗ INVALID'}`);
  r.errors.forEach(e => console.log(`  ERROR: ${e}`));
  r.warnings.forEach(w => console.log(`  WARNING: ${w}`));
});

// Exit with error if any diagrams invalid
if (results.some(r => !r.valid)) {
  process.exit(1);
}
```

## Performance Considerations

### Diagram Generation

- **Mermaid CLI**: Use headless Chrome for rendering (requires 512MB memory)
- **Parallel Generation**: Generate multiple diagrams concurrently
- **Caching**: Cache generated images, regenerate only on source changes
- **Optimization**: Compress PNG files with pngquant for faster loading

### Data Catalog Performance

- **Crawler Schedule**: Run during low-traffic hours (2 AM UTC)
- **Partition Pruning**: Use year/month partitions for efficient queries
- **Catalog Caching**: Cache frequently accessed metadata in Lambda memory
- **Query Optimization**: Use Glue ETL jobs for complex transformations

## Security Considerations

### Diagram Content

- **No Sensitive Data**: Diagrams should not contain actual ARNs, account IDs, or secrets
- **Placeholder Values**: Use `arn:aws:service:region:ACCOUNT:resource` format
- **Public Sharing**: Diagrams will be publicly visible in re:Invent presentation

### OSDU Credentials

- **Secrets Manager**: Store OSDU API keys and credentials
- **IAM Roles**: Use role-based access, not long-lived credentials
- **Rotation**: Automatic 90-day rotation policy
- **Encryption**: Secrets encrypted with AWS KMS

### Data Catalog Security

- **Resource Policies**: Restrict Data Catalog access to specific IAM roles
- **Encryption**: Catalog metadata encrypted at rest
- **Audit Logging**: CloudTrail logs all Data Catalog API calls
- **Fine-Grained Access**: Use Lake Formation for column-level security (future enhancement)

## Cost Optimization

### Diagram Generation

- **One-Time Cost**: Diagram generation is a one-time operation for re:Invent
- **Storage**: S3 storage for PNG/SVG files (~10MB total) costs <$0.01/month
- **CloudFront**: Cached diagrams minimize data transfer costs

### Data Catalog

- **Glue Crawler**: $0.44 per DPU-hour, ~0.1 DPU-hour per run = $0.044/day = $1.32/month
- **Catalog Storage**: First 1M objects free, then $1 per 100K objects/month
- **API Calls**: First 1M requests free, then $1 per 1M requests
- **Estimated Monthly Cost**: ~$2-5 for typical usage

### OSDU Integration

- **Ingestion Lambda**: 300s timeout, 1024MB, daily run = ~$0.50/month
- **S3 Storage**: Well data storage depends on volume, estimate $5-20/month for 100GB
- **Data Transfer**: OSDU API calls may incur external data transfer costs

**Total Estimated Additional Cost**: $10-30/month for OSDU + Data Catalog integration

## Conclusion

This design provides a comprehensive update to the re:Invent architecture diagrams, adding complete AWS service coverage, OSDU data integration, and AWS Data Catalog for metadata management. The updated diagrams will give technical audiences a complete understanding of the platform architecture, data flow, and integration patterns.

**Key Enhancements**:
1. **Complete Service Inventory**: All 12+ AWS services clearly shown
2. **OSDU Integration**: External data source with highlighted data flow
3. **Data Catalog**: Metadata management and data discovery patterns
4. **Enhanced Annotations**: Cost, performance, and security details
5. **Dedicated Diagrams**: Service-level detail for each major integration
6. **Validation Pipeline**: Automated testing to ensure diagram completeness

The design follows AWS Well-Architected Framework principles and provides a reusable pattern for similar energy data platforms.
