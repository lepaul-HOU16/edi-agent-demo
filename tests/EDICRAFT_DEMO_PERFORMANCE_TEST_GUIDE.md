# EDIcraft Demo Enhancements - Performance Testing Guide

## Overview

This guide provides instructions for performance testing the EDIcraft demo enhancements to ensure they meet production requirements.

## Test Environment

- **Sandbox**: Running locally with `npx ampx sandbox`
- **Minecraft Server**: edicraft.nigelgardiner.com
- **OSDU Platform**: osdu.vavourak.people.aws.dev
- **S3 Bucket**: Amplify storage bucket

## Performance Test Scenarios

### 1. Clear Button Performance Test

**Objective**: Verify the clear button responds quickly and clears the environment efficiently.

**Steps**:
1. Open chat interface with EDIcraft agent selected
2. Build a wellbore: "Build wellbore trajectory for WELL-001"
3. Wait for completion (note time)
4. Click "Clear Minecraft Environment" button
5. Measure response time
6. Verify environment is cleared in Minecraft

**Expected Results**:
- Button click triggers clear command immediately (< 100ms)
- Clear operation completes within 5-10 seconds
- Response message confirms blocks cleared
- Minecraft environment is visually clear

**Performance Metrics**:
- Button response time: < 100ms
- Clear operation time: < 10 seconds
- No UI freezing or blocking

---

### 2. Batch Visualization Performance Test

**Objective**: Test performance of visualizing multiple wells from a collection.

**Steps**:
1. Create a collection with 24 wells (or use existing collection)
2. Create canvas from collection
3. Request: "Visualize all wells from this collection"
4. Monitor progress updates
5. Measure total time to completion
6. Verify all wells are built in Minecraft

**Expected Results**:
- Progress updates appear every 5-10 seconds
- Batch processing completes within 5-10 minutes for 24 wells
- No timeouts or failures
- All wells successfully visualized

**Performance Metrics**:
- Time per well: 15-30 seconds average
- Total time for 24 wells: 6-12 minutes
- Success rate: > 95%
- Progress update frequency: Every 5-10 seconds

---

### 3. Collection Context Retention Performance Test

**Objective**: Verify collection context is retained quickly when creating new canvases.

**Steps**:
1. Create canvas from collection
2. Verify CollectionContextBadge displays
3. Click "Create New Chat" button
4. Measure time to new canvas creation
5. Verify collection context is inherited
6. Verify badge displays in new canvas

**Expected Results**:
- New canvas creation: < 2 seconds
- Collection context inherited automatically
- Badge displays immediately
- No data loss or errors

**Performance Metrics**:
- Canvas creation time: < 2 seconds
- Context inheritance: Automatic
- Badge display: Immediate

---

### 4. Response Template Performance Test

**Objective**: Verify response templates render quickly and correctly.

**Steps**:
1. Build wellbore: "Build wellbore trajectory for WELL-001"
2. Measure time from completion to response display
3. Verify response uses Cloudscape template
4. Check for visual indicators (✅, ❌, 💡)
5. Verify response formatting is correct

**Expected Results**:
- Response displays within 1 second of completion
- Template formatting is correct
- Visual indicators display properly
- No rendering errors

**Performance Metrics**:
- Response display time: < 1 second
- Template rendering: Immediate
- No visual glitches

---

### 5. S3 Data Access Performance Test

**Objective**: Test S3 data access speed for trajectory data.

**Steps**:
1. Request wellbore with S3 trajectory data
2. Measure time to fetch data from S3
3. Measure time to parse trajectory data
4. Measure total time to visualization
5. Verify data accuracy

**Expected Results**:
- S3 fetch time: < 2 seconds
- Data parsing time: < 1 second
- Total time: < 5 seconds
- Data accuracy: 100%

**Performance Metrics**:
- S3 fetch: < 2 seconds
- Parsing: < 1 second
- Total: < 5 seconds

---

### 6. Drilling Rig Builder Performance Test

**Objective**: Verify drilling rig construction is fast and efficient.

**Steps**:
1. Build wellbore with rig: "Build wellbore trajectory for WELL-001"
2. Measure time to build rig structure
3. Verify rig components (derrick, platform, equipment, signage)
4. Check for visual quality
5. Verify no block placement errors

**Expected Results**:
- Rig construction time: < 5 seconds
- All components present
- Visual quality is good
- No placement errors

**Performance Metrics**:
- Rig build time: < 5 seconds
- Component accuracy: 100%
- Visual quality: High

---

### 7. Time Lock Performance Test

**Objective**: Verify time lock command executes quickly.

**Steps**:
1. Request: "Lock the world time to daytime"
2. Measure command execution time
3. Verify time is locked in Minecraft
4. Verify daylight cycle is disabled
5. Check response message

**Expected Results**:
- Command execution: < 2 seconds
- Time locked successfully
- Daylight cycle disabled
- Response confirms lock

**Performance Metrics**:
- Execution time: < 2 seconds
- Success rate: 100%

---

### 8. Demo Reset Performance Test

**Objective**: Verify demo reset completes quickly and thoroughly.

**Steps**:
1. Build multiple wellbores and rigs
2. Request: "Reset the demo environment"
3. Measure total reset time
4. Verify all structures cleared
5. Verify time locked to day
6. Verify players teleported to spawn

**Expected Results**:
- Reset time: < 15 seconds
- All structures cleared
- Time locked to day
- Players at spawn
- Response confirms reset

**Performance Metrics**:
- Total reset time: < 15 seconds
- Clearing: < 10 seconds
- Time lock: < 2 seconds
- Teleport: < 1 second

---

## Performance Benchmarks

### Target Performance Metrics

| Operation | Target Time | Acceptable Range |
|-----------|-------------|------------------|
| Clear button click | < 100ms | 50-200ms |
| Clear environment | < 10s | 5-15s |
| Build single wellbore | < 30s | 15-45s |
| Build drilling rig | < 5s | 3-8s |
| Batch visualization (24 wells) | < 12min | 6-15min |
| Collection context retention | < 2s | 1-3s |
| Response template rendering | < 1s | 0.5-2s |
| S3 data fetch | < 2s | 1-3s |
| Time lock command | < 2s | 1-3s |
| Demo reset | < 15s | 10-20s |

### Timeout Thresholds

| Operation | Timeout | Action |
|-----------|---------|--------|
| Clear environment | 30s | Retry or report error |
| Build wellbore | 60s | Retry or skip |
| Batch visualization | 20min | Continue with completed wells |
| S3 data fetch | 10s | Use fallback or report error |
| Demo reset | 30s | Report error |

---

## Performance Testing Checklist

### Pre-Test Setup
- [ ] Sandbox is running
- [ ] Minecraft server is accessible
- [ ] OSDU credentials are valid
- [ ] S3 bucket has test data
- [ ] Collection with 24 wells exists

### Test Execution
- [ ] Clear button performance test completed
- [ ] Batch visualization performance test completed
- [ ] Collection context retention test completed
- [ ] Response template performance test completed
- [ ] S3 data access performance test completed
- [ ] Drilling rig builder performance test completed
- [ ] Time lock performance test completed
- [ ] Demo reset performance test completed

### Post-Test Validation
- [ ] All tests passed performance benchmarks
- [ ] No timeouts occurred
- [ ] No errors in CloudWatch logs
- [ ] UI remained responsive throughout
- [ ] Minecraft server remained stable

---

## Performance Issues and Solutions

### Issue: Clear button slow to respond
**Solution**: Check network latency, verify Lambda cold start, optimize clear logic

### Issue: Batch visualization timeouts
**Solution**: Reduce batch size, increase timeout, optimize wellbore building

### Issue: S3 data fetch slow
**Solution**: Enable S3 caching, use S3 Transfer Acceleration, optimize data format

### Issue: Response template rendering slow
**Solution**: Optimize template generation, reduce response size, use client-side caching

### Issue: Drilling rig builder slow
**Solution**: Batch RCON commands, optimize block placement, reduce rig complexity

---

## Monitoring and Metrics

### CloudWatch Metrics to Monitor
- Lambda execution time
- Lambda cold starts
- S3 request latency
- DynamoDB query latency
- Error rates

### Application Metrics to Track
- User interaction response time
- Operation completion time
- Success/failure rates
- Resource utilization

---

## Performance Optimization Recommendations

### Backend Optimizations
1. Enable Lambda provisioned concurrency for zero cold starts
2. Implement S3 data caching with TTL
3. Batch RCON commands to reduce network overhead
4. Optimize trajectory data parsing
5. Use async operations where possible

### Frontend Optimizations
1. Implement optimistic UI updates
2. Add loading indicators for long operations
3. Cache collection context data
4. Optimize response template rendering
5. Use React.memo for expensive components

### Infrastructure Optimizations
1. Use S3 Transfer Acceleration for large files
2. Enable DynamoDB auto-scaling
3. Configure Lambda memory and timeout appropriately
4. Use CloudFront for static assets
5. Implement API Gateway caching

---

## Conclusion

This performance testing guide ensures that all EDIcraft demo enhancements meet production performance requirements. Regular performance testing should be conducted to maintain optimal user experience.

**Next Steps**:
1. Execute all performance tests
2. Document results
3. Identify bottlenecks
4. Implement optimizations
5. Re-test to verify improvements
