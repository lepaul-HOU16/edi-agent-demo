---
inclusion: always
---

# DEPLOYMENT POLICY

## Core Rule: Localhost Testing Only

### ❌ FORBIDDEN COMMANDS
```bash
./deploy-frontend.sh          # FORBIDDEN - CI/CD only
npm run deploy                # FORBIDDEN - CI/CD only
cd cdk && npm run deploy      # FORBIDDEN - CI/CD only
aws s3 sync                   # FORBIDDEN - CI/CD only
aws cloudfront create-invalidation  # FORBIDDEN - CI/CD only
```

### ✅ ONLY ALLOWED: LOCALHOST TESTING
```bash
npm run dev                   # ALLOWED - Local development only
npm run build                 # ALLOWED - Local build verification
npm test                      # ALLOWED - Run tests locally
```

## DEPLOYMENT WORKFLOW

### The ONLY Correct Process:
1. **Make code changes**
2. **Test ONLY on localhost** (`npm run dev`)
3. **Verify fixes work locally**
4. **Commit changes to git**
5. **Push to main branch**
6. **CI/CD pipeline handles production deployment automatically**

### NEVER:
- ❌ Deploy directly to S3
- ❌ Invalidate CloudFront cache manually
- ❌ Run any deployment scripts
- ❌ Deploy before localhost testing
- ❌ Deploy untested changes
- ❌ Deploy unvalidated fixes

## WHY THIS RULE EXISTS

1. **CI/CD exists for a reason** - Automated deployment on push to main
2. **Testing required** - All changes must be tested on localhost first
3. **Validation required** - User must confirm fixes work before production
4. **No untested deployments** - Production is not a testing environment
5. **Manual deployments bypass safeguards** - CI/CD has checks and balances

## CORRECT WORKFLOW EXAMPLE

```bash
# 1. Make changes to code
vim src/components/ChatBox.tsx

# 2. Test locally ONLY
npm run dev
# Open http://localhost:5173
# Test the changes thoroughly
# Verify everything works

# 3. User confirms it works
# Wait for user to say "looks good" or "deploy this"

# 4. Commit and push
git add .
git commit -m "Fix ChatBox issues"
git push origin main

# 5. CI/CD deploys automatically
# Done. No manual deployment needed.
```

## WHAT TO SAY INSTEAD

### ❌ WRONG:
"I've deployed the fixes to production. Test at https://..."

### ✅ CORRECT:
"I've made the fixes. Please test on localhost with `npm run dev`. Once you confirm it works, commit and push to trigger CI/CD deployment."

## IF USER SAYS "DEPLOY"

Even if user says "deploy", respond with:

"The changes are ready. To deploy:
1. Test on localhost first: `npm run dev`
2. If it works, commit: `git add . && git commit -m "your message"`
3. Push to main: `git push origin main`
4. CI/CD will deploy automatically

Would you like me to help test on localhost first?"

## LOCALHOST TESTING ONLY

Your ONLY job with deployment is:
- ✅ Ensure code runs on localhost
- ✅ Help user test on localhost
- ✅ Verify no build errors locally
- ❌ NEVER touch production

## REMEMBER

- **Production deployment = CI/CD's job, not yours**
- **Your job = Write code + Test localhost**
- **User's job = Validate + Push to trigger CI/CD**

## THIS IS NON-NEGOTIABLE

Breaking this rule causes:
- Untested code in production
- Bypassing CI/CD safeguards
- User frustration
- Wasted time
- Potential production issues

**NEVER DEPLOY TO PRODUCTION. EVER.**
