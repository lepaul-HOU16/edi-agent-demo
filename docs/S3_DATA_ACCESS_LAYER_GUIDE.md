# S3 Data Access Layer - Implementation Guide

## Overview

The S3 Data Access Layer provides a robust interface for accessing well trajectory data stored in S3 buckets. This implementation supports the EDIcraft demo enhancements by enabling collection-based visualization workflows.

## Features

### Core Capabilities

1. **Multi-Format Support**
   - JSON trajectory files (coordinates and survey data)
   - CSV trajectory files (coordinates and survey data)
   - LAS (Log ASCII Standard) files with trajectory curves

2. **Intelligent Caching**
   - In-memory caching to reduce S3 API calls
   - Cache statistics and management
   - Preload capability for batch operations

3. **Comprehensive Error Handling**
   - Access denied errors with IAM permission suggestions
   - Missing file errors with fallback options
   - Network errors with retry suggestions
   - Credential errors with configuration guidance

4. **Collection Management**
   - List all wells in a collection
   - Batch preload for performance
   - Standardized data format across sources

## Installation

The S3 Data Access Layer is located at:
```
edicraft-agent/tools/s3_data_access.py
```

### Dependencies

Required Python packages (already in `requirements.txt`):
- `boto3` - AWS SDK for Python
- `botocore` - Low-level AWS service access

### Environment Variables

```bash
# Required: S3 bucket name for trajectory data
export RENEWABLE_S3_BUCKET="your-bucket-name"

# Optional: AWS credentials (if not using IAM role)
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

## Usage

### Basic Usage

```python
from tools.s3_data_access import S3WellDataAccess

# Initialize client
client = S3WellDataAccess(bucket_name="my-bucket")

# Or use environment variable
client = S3WellDataAccess()  # Uses RENEWABLE_S3_BUCKET

# Fetch trajectory data
result = client.get_trajectory_data("wells/well-007/trajectory.json")

if result['success']:
    coordinates = result['coordinates']
    print(f"Loaded {len(coordinates)} points")
else:
    print(f"Error: {result['error']}")
```

### Working with Collections

```python
# List all wells in a collection
collection_result = client.list_collection_wells("collections/demo-collection/")

if collection_result['success']:
    wells = collection_result['wells']
    print(f"Found {len(wells)} wells in collection")
    
    for well in wells:
        print(f"- {well['well_name']}: {well['s3_key']}")
```

### Batch Operations with Caching

```python
# Preload entire collection into cache
preload_result = client.preload_collection_cache("collections/demo-collection/")

print(f"Loaded {preload_result['loaded_count']} wells")
print(f"Failed {preload_result['failed_count']} wells")

# Now access wells from cache (no S3 calls)
for well in wells:
    result = client.get_trajectory_data(well['s3_key'])
    # Data served from cache - fast!
```

### Cache Management

```python
# Get cache statistics
stats = client.get_cache_stats()
print(f"Cache entries: {stats['total_entries']}")
print(f"Cache size: {stats['total_size_estimate_mb']} MB")

# Disable caching
client.enable_cache(False)

# Clear cache
client.clear_cache()

# Re-enable caching
client.enable_cache(True)
```

### Validating S3 Access

```python
# Validate permissions before operations
validation = client.validate_s3_access()

if validation['success']:
    print("✅ S3 access validated")
else:
    print(f"❌ Validation failed: {validation['error']}")
    print("Suggestions:")
    for suggestion in validation['suggestions']:
        print(f"  - {suggestion}")
```

### Error Handling with Fallbacks

```python
result = client.get_trajectory_data("wells/well-007/trajectory.json")

if not result['success']:
    error = result['error']
    
    # Determine error type
    if 'Access denied' in error:
        fallbacks = client.get_fallback_options('access_denied')
    elif 'not found' in error:
        fallbacks = client.get_fallback_options('not_found')
    else:
        fallbacks = client.get_fallback_options('unknown')
    
    print("Fallback options:")
    for option in fallbacks:
        print(f"  - {option}")
```

## Data Formats

### Coordinate Format

JSON:
```json
{
  "coordinates": [
    {"x": 1.0, "y": 2.0, "z": 3.0},
    {"x": 1.1, "y": 2.1, "z": 3.1}
  ]
}
```

CSV:
```csv
x,y,z
1.0,2.0,3.0
1.1,2.1,3.1
```

### Survey Data Format

JSON:
```json
{
  "survey_data": [
    {
      "tvd": 25.0,
      "azimuth": 310.2,
      "inclination": 0.18,
      "measured_depth": 25.0
    }
  ]
}
```

CSV:
```csv
tvd,azimuth,inclination,measured_depth
25.0,310.2,0.18,25.0
50.0,315.0,0.25,50.5
```

### LAS Format

The parser automatically detects trajectory curves in LAS files:
- Coordinates: X/Easting, Y/Northing, Z/TVD/Depth
- Survey: TVD, Azimuth, Inclination

## Return Format

All methods return a standardized dictionary:

```python
{
    "success": True,              # Boolean: operation success
    "data_type": "coordinates",   # "coordinates" | "survey" | "unknown"
    "coordinates": [...],         # List of coordinate dicts (if coordinate format)
    "survey_data": [...],         # List of survey dicts (if survey format)
    "metadata": {
        "s3_key": "...",
        "file_format": "json",
        "total_points": 107,
        "cached": False
    },
    "error": None                 # Error message if failed
}
```

## IAM Permissions

Required IAM permissions for S3 access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## Performance Considerations

### Caching Strategy

1. **Enable caching for batch operations**
   - Reduces S3 API calls
   - Improves response time
   - Reduces AWS costs

2. **Preload collections**
   - Use `preload_collection_cache()` before batch processing
   - Fetches all data upfront
   - Eliminates per-well latency

3. **Cache size management**
   - Monitor cache size with `get_cache_stats()`
   - Clear cache periodically if memory constrained
   - Disable cache for one-off operations

### Best Practices

1. **Validate access before operations**
   ```python
   validation = client.validate_s3_access()
   if not validation['success']:
       # Handle permission issues before proceeding
   ```

2. **Use batch operations for collections**
   ```python
   # Preload entire collection
   client.preload_collection_cache(collection_prefix)
   
   # Process wells from cache
   for well in wells:
       data = client.get_trajectory_data(well['s3_key'])
   ```

3. **Handle errors gracefully**
   ```python
   result = client.get_trajectory_data(s3_key)
   if not result['success']:
       fallbacks = client.get_fallback_options(error_type)
       # Implement fallback strategy
   ```

## Testing

Run the unit tests:

```bash
python3 tests/test-s3-data-access.py
```

Expected output:
```
============================================================
TEST SUMMARY
============================================================
Passed: 8/8
Failed: 0/8

✅ ALL TESTS PASSED!
```

## Integration with EDIcraft

### Collection Visualization Workflow

```python
from tools.s3_data_access import S3WellDataAccess
from tools.workflow_tools import build_wellbore_trajectory_complete

# Initialize S3 client
s3_client = S3WellDataAccess()

# List wells in collection
collection_result = s3_client.list_collection_wells("collections/demo/")

# Preload for performance
s3_client.preload_collection_cache("collections/demo/")

# Build each wellbore in Minecraft
for well in collection_result['wells']:
    # Fetch trajectory data (from cache)
    trajectory = s3_client.get_trajectory_data(well['s3_key'])
    
    if trajectory['success']:
        # Build wellbore in Minecraft
        build_wellbore_trajectory_complete(
            trajectory_data=trajectory,
            well_name=well['well_name']
        )
```

## Troubleshooting

### Common Issues

1. **"AWS credentials not found"**
   - Configure AWS CLI: `aws configure`
   - Or set environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

2. **"Access denied to S3 bucket"**
   - Check IAM permissions
   - Verify bucket policy allows access
   - Ensure correct AWS region

3. **"S3 bucket does not exist"**
   - Verify bucket name in `RENEWABLE_S3_BUCKET`
   - Check bucket exists in AWS Console
   - Ensure correct AWS account

4. **"No trajectory curves found in LAS file"**
   - LAS file may not contain trajectory data
   - Check curve names in LAS file
   - Verify file format is correct

### Debug Mode

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Now S3 operations will log detailed information
client = S3WellDataAccess()
```

## Requirements Mapping

This implementation satisfies the following requirements from the EDIcraft Demo Enhancements specification:

- **Requirement 10.1**: Access trajectory data from S3 using s3_key ✅
- **Requirement 10.2**: Parse LAS files and trajectory data ✅
- **Requirement 10.3**: Provide fallback options when S3 unavailable ✅
- **Requirement 10.4**: Cache S3 data to improve performance ✅
- **Requirement 10.5**: Validate S3 permissions before access ✅

## Next Steps

After implementing the S3 Data Access Layer, the next tasks are:

1. **Task 8**: Implement Collection Visualization Tool
   - Use S3WellDataAccess to fetch trajectory data
   - Build wellbores in batches
   - Display progress updates

2. **Task 10**: Update Collection Service
   - Add getCollectionWells query
   - Return well metadata with S3 keys

3. **Task 12**: Implement Collection Context Retention
   - Inherit collection context in new canvases
   - Load collection data automatically

## Support

For issues or questions:
1. Check CloudWatch logs for detailed error information
2. Run validation: `client.validate_s3_access()`
3. Review IAM permissions
4. Consult AWS S3 documentation

## Version History

- **v1.0.0** (2024-01-15): Initial implementation
  - Multi-format support (JSON, CSV, LAS)
  - Intelligent caching
  - Comprehensive error handling
  - Collection management
  - IAM permission validation
