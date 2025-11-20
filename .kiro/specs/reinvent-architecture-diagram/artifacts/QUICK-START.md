# Artifact Visualization Examples - Quick Start

## 📁 What's Included

This directory contains complete artifact visualization examples for the AWS Energy Data Insights platform:

- **Sample Artifacts** - JSON examples for all artifact types
- **TypeScript Schemas** - Type-safe definitions
- **Component Examples** - React component implementations
- **S3 Storage Patterns** - Storage architecture and access patterns

## 🚀 Quick Navigation

### View Sample Artifacts
```bash
# Terrain analysis
cat sample-artifacts/terrain-analysis.json

# Layout optimization
cat sample-artifacts/layout-optimization.json

# Wake simulation
cat sample-artifacts/wake-simulation.json

# Wind rose
cat sample-artifacts/wind-rose.json

# Executive report
cat sample-artifacts/executive-report.json
```

### Review TypeScript Schemas
```bash
# All artifact type definitions
cat schemas/artifact-types.ts
```

### Study Component Examples
```bash
# Central artifact renderer
cat component-examples/ArtifactRenderer.tsx

# Terrain map reference implementation
cat component-examples/TerrainMapComponent.tsx
```

### Understand S3 Patterns
```bash
# Complete storage architecture
cat s3-patterns/storage-architecture.md
```

## 📊 Artifact Types

| Type | Description | Sample File |
|------|-------------|-------------|
| `wind_farm_terrain_analysis` | Terrain features with exclusion zones | terrain-analysis.json |
| `wind_farm_layout` | Turbine positions with placement metadata | layout-optimization.json |
| `wind_farm_wake_analysis` | Wake effects and power loss | wake-simulation.json |
| `wind_rose_analysis` | Wind direction/speed distribution | wind-rose.json |
| `wind_farm_report` | Executive summary report | executive-report.json |

## 💻 Usage Example

### Rendering an Artifact

```typescript
import { ArtifactRenderer, ArtifactErrorBoundary } from './ArtifactRenderer';

function ChatMessage({ message }) {
  return (
    <div>
      <p>{message.content.text}</p>
      {message.artifacts?.map((artifact, index) => (
        <ArtifactErrorBoundary key={index}>
          <ArtifactRenderer
            artifact={artifact}
            onFollowUpAction={(query) => sendMessage(query)}
          />
        </ArtifactErrorBoundary>
      ))}
    </div>
  );
}
```

### Uploading to S3

```typescript
import { uploadArtifact } from './s3-utils';

const s3Key = await uploadArtifact(
  'project-id',
  'terrain-map',
  htmlContent,
  'text/html'
);
```

### Generating Presigned URL

```typescript
import { getArtifactUrl } from './s3-utils';

const url = await getArtifactUrl(s3Key);
// URL expires in 1 hour
```

## 🏗️ Adding a New Artifact Type

1. **Define schema** in `schemas/artifact-types.ts`
2. **Create sample** in `sample-artifacts/`
3. **Build component** in `component-examples/`
4. **Update renderer** in `ArtifactRenderer.tsx`
5. **Document storage** in `s3-patterns/`

See [README.md](README.md) for detailed instructions.

## 📖 Documentation

- [README.md](README.md) - Complete overview and integration guide
- [TASK-9-SUMMARY.md](../TASK-9-SUMMARY.md) - Implementation summary
- [Design Document](../design.md) - Full architecture details
- [Requirements](../requirements.md) - Artifact requirements

## 🎯 Key Features

✅ Complete type safety with TypeScript
✅ Realistic sample data for all artifact types
✅ Reference component implementations
✅ S3 storage architecture with cost optimization
✅ Security best practices (encryption, presigned URLs)
✅ Monitoring and alerting patterns

## 💡 Best Practices

### Artifact Design
- Keep artifacts self-contained
- Include metadata for debugging
- Use standard formats (GeoJSON)
- Provide fallback content

### Component Development
- Use error boundaries
- Implement loading states
- Support responsive layouts
- Add accessibility features

### S3 Storage
- Use consistent naming
- Implement lifecycle policies
- Enable versioning
- Monitor costs

## 🔗 Related Resources

- [Integration Guide](../integration-guide/) - Step-by-step integration
- [Starter Kit](../starter-kit/) - Boilerplate code
- [IAM Reference Cards](../iam-reference-cards/) - Permission requirements
- [Performance Guide](../performance/) - Optimization strategies

## 📞 Support

For questions or issues:
1. Review the [README.md](README.md) for detailed documentation
2. Check sample artifacts for data structure examples
3. Examine component code for implementation patterns
4. Refer to S3 patterns for storage best practices

---

**Quick Links:**
- [Sample Artifacts](sample-artifacts/) | [Schemas](schemas/) | [Components](component-examples/) | [S3 Patterns](s3-patterns/)
