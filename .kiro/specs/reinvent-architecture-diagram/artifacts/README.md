# Artifact Visualization Examples

This directory contains comprehensive examples of artifact types, schemas, frontend components, and S3 storage patterns used in the AWS Energy Data Insights platform.

## Contents

1. **Sample Artifacts** - JSON examples for each artifact type
2. **Frontend Components** - React component code examples
3. **Artifact Schemas** - TypeScript type definitions and validation
4. **S3 Storage Patterns** - Storage architecture and access patterns

## Artifact Types

The platform supports the following artifact types:

### Renewable Energy Artifacts
- **Terrain Analysis** (`wind_farm_terrain_analysis`) - GeoJSON terrain features with exclusion zones
- **Layout Optimization** (`wind_farm_layout`) - Turbine positions with intelligent placement metadata
- **Wake Simulation** (`wind_farm_wake_analysis`) - Wake effect analysis and power loss calculations
- **Wind Rose** (`wind_rose_analysis`) - Wind direction and speed distribution
- **Executive Report** (`wind_farm_report`) - Comprehensive project reports

### Petrophysical Artifacts
- **Log Curve Visualization** (`log_curve_visualization`) - Well log data plots
- **Porosity Analysis** (`porosity_analysis`) - Porosity calculation results
- **Multi-well Correlation** (`multi_well_correlation`) - Cross-well analysis

### General Artifacts
- **Data Quality Report** (`data_quality_report`) - Data completeness and validation
- **Interactive Dashboard** (`dashboard`) - Custom dashboards with metrics

## Quick Start

### 1. View Sample Artifacts
```bash
# View terrain analysis example
cat sample-artifacts/terrain-analysis.json

# View layout optimization example
cat sample-artifacts/layout-optimization.json
```

### 2. Review Component Code
```bash
# View terrain map component
cat component-examples/TerrainMapComponent.tsx

# View layout map component
cat component-examples/LayoutMapComponent.tsx
```

### 3. Understand Schemas
```bash
# View artifact type definitions
cat schemas/artifact-types.ts

# View validation schemas
cat schemas/validation.ts
```

### 4. Study S3 Patterns
```bash
# View storage architecture
cat s3-patterns/storage-architecture.md

# View access patterns
cat s3-patterns/access-patterns.md
```

## Integration Guide

### Adding a New Artifact Type

1. **Define the artifact schema** in `schemas/artifact-types.ts`
2. **Create sample artifact** in `sample-artifacts/`
3. **Build frontend component** in `component-examples/`
4. **Update artifact renderer** to handle new type
5. **Document S3 storage pattern** in `s3-patterns/`

### Rendering Artifacts in Frontend

```typescript
import { renderArtifact } from './artifact-renderer';

// In your chat message component
{message.artifacts?.map((artifact, index) => (
  <div key={index}>
    {renderArtifact(artifact)}
  </div>
))}
```

## Best Practices

### Artifact Design
- Keep artifacts self-contained with all necessary data
- Include metadata for debugging and tracing
- Use standard GeoJSON for geographic data
- Provide fallback content for visualization failures

### Component Development
- Use error boundaries for robust rendering
- Implement loading states for async data
- Support responsive layouts
- Add accessibility features (ARIA labels, keyboard navigation)

### S3 Storage
- Use consistent naming conventions
- Implement lifecycle policies for cost optimization
- Enable versioning for critical artifacts
- Use presigned URLs for secure access

## Architecture Overview

```
User Query
    ↓
Agent Processing
    ↓
Tool Lambda (Python)
    ↓
Generate Artifact
    ↓
Store in S3 (if large) + DynamoDB (metadata)
    ↓
Return to Frontend
    ↓
Artifact Renderer
    ↓
Specialized Component
    ↓
User Visualization
```

## Resources

- [Design Document](../design.md) - Full architecture details
- [Requirements](../requirements.md) - Artifact requirements
- [Integration Guide](../integration-guide/) - Step-by-step integration
- [Starter Kit](../starter-kit/) - Boilerplate code

## Support

For questions or issues:
1. Review the design document for architecture details
2. Check sample artifacts for data structure examples
3. Examine component code for implementation patterns
4. Refer to S3 patterns for storage best practices
