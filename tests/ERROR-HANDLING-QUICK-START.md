# Error Handling Tests - Quick Start Guide

**Task 9**: Test error handling for clean renewable artifact UI

## 🚀 Quick Start (5 minutes)

### Option 1: Automated Tests (Fastest)

```bash
# 1. Set your API endpoint
export API_ENDPOINT=https://your-api-gateway-url.amazonaws.com

# 2. Run automated tests
node tests/test-error-handling.js

# 3. Check results
# ✅ All tests should pass
# ✅ Error messages should be user-friendly
# ✅ No artifacts on errors
```

### Option 2: Interactive Browser Tests (Visual)

```bash
# 1. Open the HTML test page
open tests/test-error-handling.html

# 2. Update API endpoint in the file (line 234)
# Replace: const API_ENDPOINT = 'YOUR_API_ENDPOINT_HERE';
# With: const API_ENDPOINT = 'https://your-actual-endpoint.com';

# 3. Click "Run Test" on each test card

# 4. Review results
# ✅ Green = Passed
# ❌ Red = Failed
```

### Option 3: Manual Testing (Comprehensive)

```bash
# 1. Open the manual test guide
open tests/manual-test-error-handling.md

# 2. Follow step-by-step instructions

# 3. Check off each test scenario

# 4. Document results in the checklist
```

## 📋 What Gets Tested

### Error Scenarios
1. **Invalid Coordinates** - `analyze terrain at 999, 999`
2. **Missing Prerequisites** - `optimize turbine layout` (without terrain)
3. **Nonexistent Project** - `generate report for fake-project`
4. **Unknown Intent** - `do something impossible`
5. **Service Failures** - Timeout/unavailable scenarios
6. **Partial Failures** - Tool succeeds but artifact fails

### Quality Checks
- ✅ User-friendly error messages
- ✅ No technical jargon or stack traces
- ✅ Actionable guidance provided
- ✅ No artifacts returned on errors
- ✅ Application remains functional
- ✅ Workflow continuity maintained

## ✅ Expected Results

### Good Error Message Example
```
"Terrain analysis complete. Unable to generate visualization."
```

**Why it's good**:
- Clear and concise
- No technical details
- User understands what happened
- Professional tone

### Bad Error Message Example
```
"Error: Cannot read property 'features' of undefined at handler.ts:123"
```

**Why it's bad**:
- Technical stack trace
- File paths and line numbers
- User doesn't know what to do
- Unprofessional

## 🎯 Success Criteria

All tests pass when:

- [ ] Error messages are user-friendly
- [ ] No stack traces or technical jargon
- [ ] Empty artifacts array on errors
- [ ] Application doesn't crash
- [ ] Users can continue after errors
- [ ] Workflow buttons still work
- [ ] Next query works correctly

## 🔧 Troubleshooting

### Tests Won't Run
**Problem**: `Cannot connect to API endpoint`  
**Solution**: 
1. Check API_ENDPOINT is set correctly
2. Verify endpoint is deployed and accessible
3. Check CORS settings allow test origin

### Tests Fail
**Problem**: Error messages contain technical details  
**Solution**: 
1. Review orchestrator error handling
2. Check ErrorMessageTemplates usage
3. Verify fallback messages are implemented

### Can't Simulate Errors
**Problem**: Hard to trigger specific errors  
**Solution**: 
1. Use manual test guide for complex scenarios
2. Temporarily disable Lambdas for timeout tests
3. Use invalid data for validation errors

## 📊 Test Results Format

### Automated Test Output
```
═══════════════════════════════════════════════════════════
TEST 1: Terrain Analysis Error Handling
═══════════════════════════════════════════════════════════

✓ Verification Results:
  - Has message: ✅
  - Message not empty: ✅
  - No artifacts: ✅
  - Contains fallback text: ✅

✅ PASSED: Terrain error handling test
```

### Manual Test Checklist
```
Scenario 1: Invalid Coordinates
Expected Results:
  [✓] Response appears within 30 seconds
  [✓] Message text is displayed
  [✓] Message contains fallback text
  [✓] NO Cloudscape artifact displayed
  [✓] Message is user-friendly
  [✓] No console errors

Status: ☑ Pass  ☐ Fail  ☐ Blocked
```

### Interactive Test Summary
```
Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tests:    6
Passed:         6
Failed:         0

🎉 All error handling tests passed!
```

## 📁 Test Files

| File | Purpose | Usage |
|------|---------|-------|
| `test-error-handling.js` | Automated tests | `node tests/test-error-handling.js` |
| `manual-test-error-handling.md` | Manual checklist | Open and follow steps |
| `test-error-handling.html` | Interactive tests | Open in browser |
| `TASK-9-ERROR-HANDLING-TEST-SUMMARY.md` | Full documentation | Reference guide |

## 🎓 Understanding Error Handling

### Design Pattern
```typescript
// When artifact generation succeeds
{
  message: "",  // Empty - let Cloudscape template show
  artifacts: [artifact]
}

// When artifact generation fails
{
  message: "Analysis complete. Unable to generate visualization.",
  artifacts: []  // Empty - show fallback message
}
```

### Why This Matters
1. **User Experience**: Users need feedback when things fail
2. **No Blank Screens**: Empty message + no artifacts = confusion
3. **Graceful Degradation**: App continues working after errors
4. **Professional**: Error messages reflect product quality

## 🚦 Next Steps

### After Tests Pass
1. ✅ Mark task 9 as complete
2. ✅ Document any issues found
3. ✅ Verify in deployed environment
4. ✅ Get user validation

### If Tests Fail
1. ❌ Review error handling in orchestrator
2. ❌ Check fallback message implementation
3. ❌ Verify artifact generation error paths
4. ❌ Fix issues and re-test

## 💡 Tips

- **Start with automated tests** - Fastest way to verify
- **Use interactive tests** - Best for visual verification
- **Manual tests for edge cases** - Covers scenarios hard to automate
- **Test in deployed environment** - Local tests may not catch all issues
- **Check browser console** - Look for unhandled errors

## 📞 Need Help?

### Common Questions

**Q: How do I get the API endpoint?**  
A: Check your AWS Amplify console or `amplify_outputs.json`

**Q: Tests pass locally but fail in production?**  
A: Check CloudWatch logs for actual error messages

**Q: How do I simulate a timeout?**  
A: Use manual test guide - temporarily disable a Lambda

**Q: Error messages still show technical details?**  
A: Review `ErrorMessageTemplates` and `RenewableErrorFormatter`

---

**Ready to test?** Pick an option above and start testing! 🚀
