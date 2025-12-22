# S3 Data Structure for Knowledge Graph

## Data Source

**Provider**: S&P Global and TGS  
**Format**: LAS (Log ASCII Standard) files  
**Location**: S3 bucket at `global/well-data/`  
**Count**: 24 numbered well files

## LAS File Structure

Each LAS file contains:

### Header Sections
- `~V` (Version Information): LAS version, wrap mode
- `~W` (Well Information): Well name, location, coordinates, dates, depths
- `~C` (Curve Information): List of all curves with units and descriptions
- `~P` (Parameter Information): Additional parameters and constants
- `~A` (ASCII Log Data): The actual curve data

### Standard Curves Expected

**Essential Curves** (for petrophysical analysis):
- `DEPT` - Depth (meters or feet)
- `GR` - Gamma Ray (API units)
- `RHOB` - Bulk Density (g/cm³)
- `NPHI` - Neutron Porosity (decimal or %)
- `RT` or `ILD` - Resistivity (ohm-m)

**Additional Curves** (if available):
- `DT` or `DTCO` - Sonic (μs/ft)
- `CALI` - Caliper (inches)
- `SP` - Spontaneous Potential (mV)
- `PEF` - Photoelectric Factor
- `DRHO` - Density Correction

## Metadata Extraction

From each LAS file, we extract:

### Well Information
```typescript
{
  filename: string;           // e.g., "01_well_alpha.las"
  wellName: string;           // From WELL field in ~W section
  operator: string;           // From COMP field in ~W section
  location: string;           // From LOC field in ~W section
  latitude: number;           // From LAT field in ~W section
  longitude: number;          // From LON field in ~W section
  startDepth: number;         // From STRT field in ~W section
  stopDepth: number;          // From STOP field in ~W section
  step: number;               // From STEP field in ~W section
}
```

### Curve Information
```typescript
{
  curves: string[];           // Array of curve names (e.g., ["DEPT", "GR", "RHOB"])
  dataPoints: number;         // Count of data rows in ~A section
  depthRange: string;         // e.g., "1000m - 3500m"
}
```

### File Metadata
```typescript
{
  size: number;               // File size in bytes
  lastModified: string;       // Last modification date
  s3Key: string;              // Full S3 key path
}
```

## Relationship Discovery

### Geographic Proximity
Wells within 10km of each other are linked with "Geographic Proximity" relationship.

### Similar Depth Ranges
Wells with overlapping depth ranges (same formation) are linked with "Similar Depth" relationship.

### Similar Logging Programs
Wells with >70% curve overlap are linked with "Similar Logging" relationship.

### Same Operator
Wells from the same operator are linked with "Same Operator" relationship.

## Quality Assessment

### High Quality (80-100)
- Has all essential curves (GR, RHOB, NPHI, RT, DEPT)
- >1000 data points
- File size >50KB
- >8 curves total

### Medium Quality (60-79)
- Missing 1-2 essential curves
- 500-1000 data points
- File size 10-50KB
- 5-8 curves total

### Low Quality (0-59)
- Missing 3+ essential curves
- <500 data points
- File size <10KB
- <5 curves total

## Duplicate Detection

Wells are flagged as potential duplicates if:
- Name similarity >80% (Levenshtein distance)
- Location within 1km
- Curve set similarity >70%
- Data point count within 10%

## Example Well Node

```json
{
  "id": "01_well_alpha",
  "type": "well",
  "name": "Well Alpha",
  "lat": 29.1234,
  "lng": -94.5678,
  "data": {
    "filename": "01_well_alpha.las",
    "curves": ["DEPT", "GR", "RHOB", "NPHI", "RT", "DT"],
    "dataPoints": 2500,
    "operator": "S&P Global",
    "depth": "1000m - 3500m",
    "location": "Gulf of Mexico",
    "dataSource": "S&P Global / TGS"
  },
  "qualityScore": 92,
  "qualityLevel": "high",
  "sourceDocs": [{
    "title": "01_well_alpha.las",
    "type": "LAS",
    "date": "2024-01-15",
    "size": "125 KB",
    "url": "s3://bucket/global/well-data/01_well_alpha.las"
  }]
}
```

## Implementation Notes

1. **Async Loading**: LAS files are loaded asynchronously from S3 to avoid blocking
2. **Caching**: Parsed LAS metadata should be cached to avoid re-parsing
3. **Error Handling**: Handle missing or malformed LAS files gracefully
4. **Performance**: Parse only header sections initially, load full data on demand
5. **Validation**: Validate LAS file structure before attempting to parse
