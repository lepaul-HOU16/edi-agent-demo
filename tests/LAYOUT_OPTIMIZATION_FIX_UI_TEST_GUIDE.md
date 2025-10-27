# Layout Optimization Fix - UI Testing Guide

## Overview
This guide helps you manually test the layout optimization persistence fix in the UI.

## Prerequisites
- Sandbox must be deployed and running
- Chat interface must be accessible

## Test Scenarios

### ✅ Test 1: Happy Path - Auto-fill from Context

**Steps:**
1. Open the chat interface
2. Start a new chat session
3. Send: `analyze terrain at 35.067482, -101.395466`
4. Wait for terrain analysis to complete
5. Send: `optimize layout` (WITHOUT coordinates)

**Expected Results:**
- ✅ Layout optimization should succeed
- ✅ Response should indicate coordinates were used from project
- ✅ No error about missing coordinates
- ✅ Layout visualization should be generated

**What to Look For:**
- Check thought steps for "Loading project data" or "Auto-filled coordinates"
- Verify no "Missing required parameters" error
- Confirm layout artifact is displayed

---

### ✅ Test 2: Error Case - No Context

**Steps:**
1. Open the chat interface
2. Start a NEW chat session (different from Test 1)
3. Send: `optimize layout` (WITHOUT prior terrain analysis)

**Expected Results:**
- ❌ Layout optimization should fail gracefully
- ✅ Error message should be helpful and suggest next steps
- ✅ Error should mention either:
  - Providing coordinates explicitly
  - Running terrain analysis first

**What to Look For:**
- Error message should NOT be generic
- Should include actionable suggestions
- Should be user-friendly

---

### ✅ Test 3: Explicit Coordinates Override

**Steps:**
1. Continue in the same session from Test 1 (where terrain analysis was done)
2. Send: `optimize layout at 40.0, -100.0` (different coordinates)

**Expected Results:**
- ✅ Layout optimization should succeed
- ✅ Should use the NEW coordinates (40.0, -100.0)
- ✅ Should NOT use the old coordinates from terrain analysis

**What to Look For:**
- Verify the layout is generated for the new location
- Check that explicit parameters take precedence

---

### ✅ Test 4: Complete Workflow

**Steps:**
1. Start a new chat session
2. Send: `analyze terrain at 35.067482, -101.395466`
3. Wait for completion
4. Send: `optimize layout` (no coordinates)
5. Wait for completion
6. Send: `run wake simulation` (no project ID)
7. Wait for completion
8. Send: `generate report` (no project ID)

**Expected Results:**
- ✅ All steps should succeed
- ✅ No need to repeat coordinates or project information
- ✅ Natural conversational flow

**What to Look For:**
- Each step builds on the previous
- No errors about missing parameters
- Smooth user experience

---

## CloudWatch Logs Verification

### Check Orchestrator Logs

1. Go to AWS CloudWatch Console
2. Navigate to Log Groups
3. Find `/aws/lambda/[stack]-renewableOrchestrator-[hash]`
4. Look for recent log streams

### What to Look For:

**Successful Context Usage:**
```
✅ Auto-filled coordinates from project context
Project data loaded: { projectName: '...', coordinates: {...} }
Validation passed with context
satisfiedByContext: ['latitude', 'longitude']
```

**Proper Error Handling:**
```
Missing required parameters: latitude, longitude
No active project found
Returning helpful error message
```

---

## Troubleshooting

### Issue: "Missing required parameters" even after terrain analysis

**Possible Causes:**
1. Project data not saved properly
2. Session ID mismatch
3. S3 permissions issue

**Debug Steps:**
1. Check CloudWatch logs for "Project data loaded"
2. Verify S3 bucket has project data
3. Check session ID is consistent

---

### Issue: Error message not helpful

**Possible Causes:**
1. Error message templates not deployed
2. Intent detection issue

**Debug Steps:**
1. Check CloudWatch logs for error message generation
2. Verify errorMessageTemplates.ts is deployed
3. Check intent type is correct

---

### Issue: Explicit coordinates not overriding context

**Possible Causes:**
1. Parameter parsing issue
2. Context taking precedence incorrectly

**Debug Steps:**
1. Check CloudWatch logs for parameter parsing
2. Verify intent.params has explicit coordinates
3. Check validation logic order

---

## Success Criteria

All tests should pass with:
- ✅ Natural conversational flow
- ✅ No repeated parameter requests
- ✅ Helpful error messages
- ✅ Explicit parameters override context
- ✅ Smooth user experience

---

## Automated Validation

For automated testing, run:
```bash
node tests/validate-layout-optimization-fix.js
```

This will test all scenarios programmatically and verify CloudWatch logs.
