# Task 5: Deploy and Validate - Quick Reference

## Quick Deployment

### 1. Deploy Backend (2-3 minutes)
```bash
cd edicraft-agent
make deploy
```

### 2. Deploy Frontend (5-10 minutes)
```bash
npx ampx sandbox
```

### 3. Run Tests (5 minutes)
```bash
bash tests/validate-complete-clear-terrain-workflow.sh
```

## Quick Validation

### Test 1: Clear Button (1 minute)
1. Open web app
2. Select "EDIcraft"
3. Click "Clear Minecraft Environment"
4. ✅ Verify only ONE button appears

### Test 2: Complete Workflow (3 minutes)
1. Send: "Build wellbore for WELL-011"
2. Wait for build
3. Click "Clear Minecraft Environment"
4. ✅ Verify all blocks removed
5. ✅ Verify terrain filled

### Test 3: Sign Variants (2 minutes)
1. Build wellbore with rig
2. Note signs on rig
3. Clear environment
4. ✅ Verify all signs removed

## Quick Troubleshooting

### Problem: Agent not updating
```bash
cd edicraft-agent
make deploy
# Wait 2-3 minutes
```

### Problem: Frontend not updating
```bash
# Restart sandbox
npx ampx sandbox
# Clear browser cache
# Hard refresh (Cmd+Shift+R)
```

### Problem: Tests failing
```bash
# Check Minecraft connection
telnet edicraft.nigelgardiner.com 49001

# Check environment variables
cat edicraft-agent/config.ini

# Check CloudWatch logs
aws logs tail /aws/bedrock/agent/edicraft --follow
```

## Quick Checklist

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Automated tests passed
- [ ] Clear button test passed
- [ ] Complete workflow test passed
- [ ] Sign variants test passed
- [ ] Terrain filling test passed
- [ ] No regressions detected
- [ ] User validated

## Quick Links

- **Full Validation Guide:** `tests/TASK_5_DEPLOYMENT_VALIDATION.md`
- **Deployment Summary:** `TASK_5_DEPLOYMENT_SUMMARY.md`
- **Deployment Script:** `deploy-clear-terrain-fixes.sh`
- **Requirements:** `.kiro/specs/fix-edicraft-clear-and-terrain/requirements.md`
- **Design:** `.kiro/specs/fix-edicraft-clear-and-terrain/design.md`

## Status

✅ Code changes complete
⏳ Deployment pending
⏳ Validation pending

**Next:** Deploy backend and run tests

