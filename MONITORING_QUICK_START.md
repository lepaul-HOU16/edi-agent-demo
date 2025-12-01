# 24-Hour Monitoring - Quick Start

## Start Monitoring Now

```bash
./monitor-production-24h.sh start
```

This runs automatically for 24 hours, checking every hour.

## Set Reminders

- **Hour 4**: Quick manual check
- **Hour 8**: Deep manual check
- **Hour 12**: Quick manual check
- **Hour 16**: Deep manual check
- **Hour 20**: Quick manual check
- **Hour 24**: Final check + create report

## Manual Check Procedure

### 1. Open Production
https://d2hkqpgqguj4do.cloudfront.net

### 2. Test Each Agent

| Agent | Test Query | What to Verify |
|-------|-----------|----------------|
| General Knowledge | "Explain quantum computing" | Single indicator, incremental streaming, cleanup |
| Petrophysics | "Analyze well data quality" | Single indicator, streaming, cleanup |
| Maintenance | "Check equipment status" | Single indicator, streaming, cleanup |
| Renewables | Load project → click workflow | Context extracted, request works, action executes |

### 3. Verify Each Test

- [ ] Only one Thinking indicator appears
- [ ] Indicator disappears when response completes
- [ ] Thought steps appear incrementally (3-5 seconds apart)
- [ ] No stale indicators after page reload
- [ ] Project context works correctly (Renewables only)

## Quick Commands

```bash
# Check status
./monitor-production-24h.sh status

# View log
tail -f monitoring-log-24h.txt

# Check CloudWatch errors
./check-cloudwatch-errors.sh

# Check DynamoDB health
./check-dynamodb-streaming-messages.sh
```

## Watch For

### 🚨 Critical (Act Immediately)
- Multiple Thinking indicators
- Persistent indicators after response
- All CoT steps appearing at once (batched)
- Missing project context errors

### ⚠️  Warning (Monitor Closely)
- Occasional cleanup failures (<5% OK, >5% investigate)
- Slow streaming (>10 seconds between steps)
- Stale messages accumulating (>10 messages)

## After 24 Hours

1. Review `monitoring-log-24h.txt`
2. Count successes, warnings, errors
3. Create final report
4. Mark task complete

## Full Documentation

- **Main Guide**: `TASK_24_MONITORING_GUIDE.md`
- **Setup**: `TASK_24_MONITORING_SETUP_COMPLETE.md`
- **Details**: `TASK_24_IMPLEMENTATION_COMPLETE.md`
- **Completion**: `TASK_24_COMPLETE.md`

---

**Start now**: `./monitor-production-24h.sh start`
