# Task 4: Quick Start Guide

## Run All Tests

```bash
./tests/validate-complete-clear-terrain-workflow.sh
```

## Run Individual Tests

### 1. Complete Workflow Test
```bash
python3 tests/test-complete-clear-terrain-workflow.py
```

Tests:
- Build test structure with signs
- Execute clear operation
- Verify all blocks removed
- Verify terrain filled correctly
- Verify UI implementation

### 2. Sign Variants Verification
```bash
python3 tests/verify-sign-variants.py
```

Verifies:
- All sign variants in rig_blocks list
- oak_sign, oak_wall_sign, spruce_sign, etc.

### 3. UI Duplication Test
```bash
node tests/test-clear-button-ui-fix.js
```

Tests:
- Clear confirmation detection
- Content hash generation
- CSS class assignment
- Detection logic consistency
- Duplicate prevention

### 4. Clear Button Flow Test
```bash
node tests/test-clear-button-flow.js
```

Tests:
- Agent router pattern matching
- Intent classification
- Message flow simulation
- Potential issues check

## Manual Testing

Follow the detailed guide:
```bash
cat tests/TASK_4_MANUAL_TEST_GUIDE.md
```

Key steps:
1. Build test wellbore with drilling rig
2. Click "Clear Minecraft Environment" button
3. Verify all blocks removed (including signs)
4. Verify terrain filled correctly
5. Verify single clear button in UI

## Expected Results

### Automated Tests
```
✅ Complete workflow test: PASSED
✅ Sign variants verification: PASSED
✅ UI duplication test: PASSED
✅ Clear button flow test: PASSED

Results: 4/4 tests passed
```

### Requirements Validation
```
✅ Requirement 1.3: All blocks removed (including signs)
✅ Requirement 1.4: Terrain filled correctly at all layers
✅ Requirement 3.6: UI shows single clear button
```

## Troubleshooting

### RCON Connection Failed
```bash
# Check Minecraft server is running
# Verify RCON enabled in server.properties
# Check credentials in edicraft-agent/config.ini
```

### Import Errors
```bash
# Add edicraft-agent to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/edicraft-agent"
```

### Node Tests Fail
```bash
# Check Node.js version
node --version  # Should be v18+

# Install dependencies
npm install
```

## Next Steps

After all tests pass:

1. **Mark Task 4 Complete** ✅
2. **Proceed to Task 5**: Deploy and validate in sandbox
3. **Test with Actual Minecraft Server**
4. **Verify No Regressions**

## Documentation

- **Implementation Summary**: `tests/TASK_4_IMPLEMENTATION_SUMMARY.md`
- **Manual Test Guide**: `tests/TASK_4_MANUAL_TEST_GUIDE.md`
- **Validation Script**: `tests/validate-complete-clear-terrain-workflow.sh`
