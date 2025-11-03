# Task 10: Complete Workflows - Quick Reference

## Quick Start

```bash
cd tests
./run-workflow-tests.sh
```

## What Gets Tested

| Test | Duration | Requirements |
|------|----------|--------------|
| 1. Clear Operation | ~5s | 2.1-2.5 |
| 2. Time Lock | ~65s | 3.1-3.5 |
| 3. Terrain Fill | ~10s | 4.1-4.5 |
| 4. Error Recovery | ~10s | 6.1-6.5 |
| 5. Performance | ~30s | 7.1-7.5 |

**Total Time**: ~2-3 minutes

## Prerequisites Checklist

- [ ] Minecraft server running
- [ ] RCON enabled in server.properties
- [ ] config.ini configured with RCON credentials
- [ ] Python 3 installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)

## Expected Output

```
✅ PASS: Clear Operation Workflow
✅ PASS: Time Lock Workflow
✅ PASS: Terrain Fill Workflow
✅ PASS: Error Recovery Workflow
✅ PASS: Performance Workflow

Total: 5/5 tests passed

🎉 All workflow tests passed!
```

## Common Issues

### "Failed to setup RCON executor"
→ Check Minecraft server is running and RCON is enabled

### "Clear operation failed"
→ Verify RCON credentials in config.ini

### "Time lock did not persist"
→ Check server version supports doDaylightCycle gamerule

### "Performance target not met"
→ Check server TPS (should be 20)

## Manual Testing

### Test Clear Operation
```bash
# Place test blocks
/setblock 0 100 0 obsidian
/setblock 1 100 1 glowstone

# Use EDIcraft clear tool
# Then verify:
/testforblock 0 100 0 air
/testforblock 1 100 1 air
```

### Test Time Lock
```bash
# Set and lock
/time set day
/gamerule doDaylightCycle false

# Wait 60 seconds, then verify:
/time query daytime
/gamerule doDaylightCycle
```

### Test Terrain Fill
```bash
# Create hole
/setblock 10 65 10 air

# Use EDIcraft clear with terrain preservation
# Then verify:
/testforblock 10 65 10 grass_block
```

## Performance Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| Small clear | < 5s | 2-3s |
| Medium clear | < 15s | 8-12s |
| Large clear | < 30s | 20-25s |
| Terrain fill | < 15s | 10-12s |

## Files

- **Test Suite**: `test-complete-workflows.py`
- **Quick Start**: `run-workflow-tests.sh`
- **Full Guide**: `TASK_10_COMPLETE_WORKFLOWS_TEST_GUIDE.md`
- **Summary**: `TASK_10_IMPLEMENTATION_SUMMARY.md`

## Success Criteria

All 5 tests must pass:
- ✅ Clear operation completes and verifies clean
- ✅ Time lock persists for 60 seconds
- ✅ Terrain fill repairs surface holes
- ✅ Error recovery provides clear messages
- ✅ Performance meets < 30s target

## Next Steps

### If All Pass
→ Proceed to Task 11 (Deploy and Validate)

### If Any Fail
1. Review test output for specific errors
2. Check troubleshooting section in full guide
3. Verify prerequisites
4. Fix issues and re-run

## Help

For detailed information, see:
- `TASK_10_COMPLETE_WORKFLOWS_TEST_GUIDE.md` - Complete testing guide
- `TASK_10_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `.kiro/specs/fix-edicraft-rcon-reliability/` - Full specification

---

**Task 10**: ✅ Complete Workflows Testing
**Status**: Ready for execution
**Time**: ~2-3 minutes
