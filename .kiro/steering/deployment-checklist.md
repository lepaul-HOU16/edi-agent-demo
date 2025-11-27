# DEPLOYMENT CHECKLIST - MANDATORY FOR EVERY TASK

## Before Marking ANY Task Complete

### ✅ Required Steps (ALL must be completed)

1. **Code Implementation**
   - [ ] All code changes written
   - [ ] Code follows project standards
   - [ ] No syntax errors or warnings

2. **Local Testing**
   - [ ] Tested locally with `npm run dev`
   - [ ] Verified functionality works as expected
   - [ ] Checked browser console for errors

3. **FRONTEND DEPLOYMENT** ⚠️ MANDATORY ⚠️
   - [ ] Ran `./deploy-frontend.sh`
   - [ ] Build completed successfully
   - [ ] Files uploaded to S3
   - [ ] CloudFront invalidation initiated
   - [ ] Noted invalidation ID

4. **Cache Propagation**
   - [ ] Waited 1-2 minutes for CloudFront cache to clear
   - [ ] Did not skip this waiting period

5. **Production Verification**
   - [ ] Opened https://d2hkqpgqguj4do.cloudfront.net
   - [ ] Tested the specific feature/fix
   - [ ] Verified changes are visible to users
   - [ ] Checked browser console for errors
   - [ ] Confirmed API calls work correctly

6. **Documentation**
   - [ ] Updated relevant documentation
   - [ ] Created deployment summary (if significant change)
   - [ ] Noted any breaking changes

### Backend Deployment (If Backend Changes Were Made)

- [ ] Ran `cd cdk && npm run deploy`
- [ ] Verified Lambda functions updated
- [ ] Checked CloudWatch logs for errors
- [ ] **THEN deployed frontend** (yes, again)

## Quick Command Reference

```bash
# Frontend deployment (ALWAYS REQUIRED)
./deploy-frontend.sh

# Backend deployment (when backend changes made)
cd cdk
npm run deploy
cd ..

# After backend deployment, ALWAYS deploy frontend again
./deploy-frontend.sh
```

## Production URL

**Always test here after deployment:**
https://d2hkqpgqguj4do.cloudfront.net

## Common Deployment Errors

### Build Fails
- Check for TypeScript errors: `npm run build`
- Fix errors and redeploy

### S3 Upload Fails
- Verify AWS credentials are configured
- Check AWS CLI is installed: `aws --version`

### Changes Not Visible
- Wait full 2 minutes for cache invalidation
- Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check CloudFront invalidation status in AWS Console

## Remember

**A task is NOT complete until the frontend is deployed and verified in production.**

**Local testing ≠ Production deployment**

**Backend deployment ≠ Frontend deployment**

**ALWAYS DEPLOY THE FRONTEND.**
