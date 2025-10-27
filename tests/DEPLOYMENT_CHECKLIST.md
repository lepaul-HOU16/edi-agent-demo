# Layout Optimization Fix - Deployment Checklist

## Pre-Deployment Checklist

- [x] Code changes complete
- [x] Unit tests passing
- [x] Integration tests passing
- [x] E2E tests passing
- [x] Deployment scripts created
- [x] Validation scripts created
- [x] Documentation complete
- [x] Dependencies installed

## Deployment Checklist

### Option A: Automated Deployment (Recommended)

- [ ] Run: `./scripts/deploy-layout-optimization-fix.sh`
- [ ] Wait for deployment (10-15 minutes)
- [ ] Review automated test results
- [ ] Verify all tests pass

### Option B: Manual Deployment

- [ ] Stop current sandbox (if running)
- [ ] Run: `npx ampx sandbox --stream-function-logs`
- [ ] Wait for "Deployed" message (5-10 minutes)
- [ ] Run: `node tests/check-deployment-status.js`
- [ ] Verify deployment status is good
- [ ] Run: `node tests/validate-layout-optimization-fix.js`
- [ ] Verify all tests pass

## Post-Deployment Validation

### Automated Tests
- [ ] Test 1: Terrain analysis - PASS
- [ ] Test 2: Auto-fill from context - PASS
- [ ] Test 3: Helpful error without context - PASS
- [ ] Test 4: Explicit coordinates override - PASS
- [ ] CloudWatch logs verification - PASS

### Manual UI Tests
- [ ] Test 1: Terrain → Layout (no coords) - SUCCESS
- [ ] Test 2: Layout without context - HELPFUL ERROR
- [ ] Test 3: Layout with explicit coords - SUCCESS
- [ ] Test 4: Complete workflow - SUCCESS

### CloudWatch Logs
- [ ] Check for "Auto-filled coordinates" messages
- [ ] Check for "project context" logging
- [ ] Check for "satisfiedByContext" entries
- [ ] Verify no errors in logs

## Success Criteria

- [ ] All automated tests pass
- [ ] All UI tests pass
- [ ] CloudWatch logs show expected behavior
- [ ] No errors in deployment
- [ ] User experience is smooth

## If Issues Occur

### Deployment Issues
- [ ] Check TypeScript compilation: `npx tsc --noEmit`
- [ ] Review deployment logs: `tail -100 /tmp/sandbox-deploy.log`
- [ ] Verify environment variables: `node tests/check-deployment-status.js`

### Validation Issues
- [ ] Check CloudWatch logs for errors
- [ ] Verify code timestamp is recent
- [ ] Re-run validation: `node tests/validate-layout-optimization-fix.js`
- [ ] Test manually in UI

### Rollback Required
- [ ] Stop sandbox (Ctrl+C)
- [ ] Revert changes: `git checkout HEAD~1 amplify/functions/`
- [ ] Redeploy: `npx ampx sandbox`
- [ ] Verify rollback: `node tests/check-deployment-status.js`

## Final Sign-Off

- [ ] Deployment successful
- [ ] All tests passing
- [ ] User validated fix
- [ ] Task marked complete

## Commands Quick Reference

```bash
# Automated deployment
./scripts/deploy-layout-optimization-fix.sh

# Manual deployment
npx ampx sandbox --stream-function-logs

# Check deployment status
node tests/check-deployment-status.js

# Run validation tests
node tests/validate-layout-optimization-fix.js

# View UI test guide
cat tests/LAYOUT_OPTIMIZATION_FIX_UI_TEST_GUIDE.md
```

## Time Estimates

- Deployment: 10-15 minutes
- Automated validation: 2-3 minutes
- Manual UI testing: 5-10 minutes
- Total: 15-30 minutes

## Notes

- Sandbox must be running for tests to work
- Use same session ID for terrain + layout tests
- CloudWatch logs may take 1-2 minutes to appear
- Browser cache may need clearing for UI tests

---

**Status**: Ready for deployment
**Next Action**: Run deployment script
**Estimated Time**: 15-30 minutes
