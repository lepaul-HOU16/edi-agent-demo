# Performance Monitoring Quick Reference

## Quick Test

```bash
# Test performance monitoring
node tests/test-performance-monitoring.js
```

## Performance Metrics Structure

```json
{
  "performance": {
    "coldStart": true,        // Boolean: true if cold start
    "initTime": 12.45,        // Float: initialization time (seconds)
    "executionTime": 45.23,   // Float: total execution time (seconds)
    "memoryUsed": 512.34,     // Float: peak memory usage (MB)
    "memoryDelta": 266.67     // Float: memory used during execution (MB)
  }
}
```

## CloudWatch Log Patterns

### Cold Start
```
🥶 COLD START - First invocation of this Lambda container
⏱️  Initialization time: 12.45s
💾 Memory at start: 245.67 MB
✅ Cold start complete - container now warm
⏱️  Total execution time: 45.23s
💾 Peak memory: 512.34 MB (used: 266.67 MB)
📊 Performance metrics: {...}
```

### Warm Start
```
⚡ WARM START - Reusing initialized Lambda container
💾 Memory at start: 512.34 MB
⏱️  Total execution time: 8.12s
💾 Peak memory: 534.56 MB (used: 22.34 MB)
📊 Performance metrics: {...}
```

## CloudWatch Insights Queries

### Average Cold Start Time
```
fields @timestamp, @message
| filter @message like /COLD START/
| filter @message like /Initialization time/
| parse @message /Initialization time: (?<initTime>[\d.]+)s/
| stats avg(initTime) as avgColdStart, max(initTime) as maxColdStart, min(initTime) as minColdStart
```

### Average Warm Start Time
```
fields @timestamp, @message
| filter @message like /WARM START/
| filter @message like /Total execution time/
| parse @message /Total execution time: (?<execTime>[\d.]+)s/
| stats avg(execTime) as avgWarmStart, max(execTime) as maxWarmStart, min(execTime) as minWarmStart
```

### Memory Usage Trends
```
fields @timestamp, @message
| filter @message like /Peak memory/
| parse @message /Peak memory: (?<peakMem>[\d.]+) MB/
| stats avg(peakMem) as avgMemory, max(peakMem) as maxMemory by bin(5m)
```

### Cold Start Rate
```
fields @timestamp, @message
| filter @message like /START/ or @message like /WARM START/
| stats count(@message) as total by @message
```

## Performance Targets

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| Cold Start | < 5 min | < 10 min | > 10 min |
| Warm Start | < 30 sec | < 60 sec | > 60 sec |
| Memory Usage | < 2.5 GB | < 2.8 GB | > 2.8 GB |
| Success Rate | > 95% | > 90% | < 90% |

## Troubleshooting

### Cold Start Too Long (> 5 minutes)
1. Check initialization time in logs
2. Identify slow dependencies (PyWake, GeoPandas, etc.)
3. Implement lazy loading (Task 6)
4. Optimize Dockerfile (Task 9)
5. Consider provisioned concurrency (Task 5)

### High Memory Usage (> 2.5 GB)
1. Check memory delta in logs
2. Identify memory-intensive operations
3. Implement lazy loading for heavy libraries
4. Optimize data processing
5. Consider increasing memory allocation

### Warm Start Slower Than Expected
1. Check if container is being recycled
2. Verify warm start detection is working
3. Check for memory leaks
4. Review agent execution logic

## Integration with UI

The performance metrics are included in every Lambda response and can be displayed in the UI:

```typescript
// In ChatMessage component
if (response.performance) {
  const { coldStart, initTime, executionTime } = response.performance;
  
  if (coldStart) {
    showMessage(`Agent initialized in ${initTime}s (first request)`);
  }
  
  showMessage(`Completed in ${executionTime}s`);
}
```

## Next Steps

1. **Task 3**: Add progress updates during initialization
2. **Task 6**: Implement lazy loading for optimization
3. **Task 11**: Create CloudWatch alarms based on metrics
4. **Task 12**: Document performance benchmarks
